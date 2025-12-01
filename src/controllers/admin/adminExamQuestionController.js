// src/controllers/admin/adminExamQuestionController.js
const mongoose = require("mongoose");
const xlsx = require("xlsx");
const { parse } = require("csv-parse/sync");

const ExamQuestionBank = require("../../models/ExamQuestionBank");
const Course = require("../../models/Course");

/* =========================================================
 * 1. LẤY DANH SÁCH CÂU HỎI (ADMIN / TEACHER)
 * GET /api/admin/exam-questions
 * query: course, chapter, tag, difficulty, q/search, page, limit
 * =======================================================*/
exports.getQuestions = async (req, res) => {
  try {
    let {
      course,
      chapter,
      tag,
      difficulty,
      q,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const filter = {};
    if (course) filter.course = course;
    if (chapter) filter.chapter = chapter;
    if (difficulty) filter.difficulty = difficulty;
    if (tag) filter.tags = tag;

    const keyword = (q || search || "").trim();
    if (keyword) {
      filter.content = { $regex: keyword, $options: "i" };
    }

    const total = await ExamQuestionBank.countDocuments(filter);
    const items = await ExamQuestionBank.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    console.error("❌ [admin] getQuestions error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
 * 2. FILTERS CHO 1 COURSE
 * GET /api/admin/exam-questions/filters?course=...
 * =======================================================*/
exports.getQuestionFilters = async (req, res) => {
  try {
    const { course } = req.query;
    if (!course) {
      return res
        .status(400)
        .json({ message: "Thiếu course trên query string." });
    }

    if (!mongoose.isValidObjectId(course)) {
      return res.status(400).json({ message: "course không hợp lệ." });
    }

    const docs = await ExamQuestionBank.find({ course })
      .select("chapter tags")
      .lean();

    const chapterSet = new Set();
    const tagSet = new Set();

    docs.forEach((d) => {
      if (d.chapter) chapterSet.add(d.chapter);
      (d.tags || []).forEach((t) => t && tagSet.add(t));
    });

    res.json({
      chapters: Array.from(chapterSet),
      tags: Array.from(tagSet),
      difficulties: ["easy", "medium", "hard"],
    });
  } catch (err) {
    console.error("❌ [admin] getQuestionFilters error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
 * 3. TẠO CÂU HỎI MỚI
 * POST /api/admin/exam-questions
 * =======================================================*/
exports.createQuestion = async (req, res) => {
  try {
    const b = req.body || {};

    if (!b.course || !b.content || !b.type) {
      return res
        .status(400)
        .json({ message: "Thiếu course, content hoặc type." });
    }

    const courseExists = await Course.findById(b.course).select("_id");
    if (!courseExists) {
      return res.status(400).json({ message: "Khoá học không tồn tại." });
    }

    let type = b.type;
    let options = Array.isArray(b.options) ? b.options : [];
    let correctAnswer = b.correctAnswer || "";
    let expectedAnswer = b.expectedAnswer || "";
    let aiAutoGrade = !!b.aiAutoGrade;
    let score =
      typeof b.score === "number" && b.score > 0 ? b.score : 1;

    // ===== VALIDATE THEO TYPE =====
    if (type === "multiple_choice") {
      if (!options.length || options.length < 2) {
        return res.status(400).json({
          message: "Câu hỏi trắc nghiệm cần tối thiểu 2 phương án.",
        });
      }
      const hasCorrect = options.some((o) => o && o.isCorrect);
      if (!hasCorrect) {
        return res.status(400).json({
          message: "Câu hỏi trắc nghiệm phải có ít nhất 1 đáp án đúng.",
        });
      }

      // không dùng correctAnswer / expectedAnswer cho multiple_choice
      correctAnswer = "";
      expectedAnswer = "";
      // trắc nghiệm mặc định auto chấm theo options
      aiAutoGrade = false;
    } else if (type === "true_false") {
      const v = (correctAnswer || "").toString().trim().toLowerCase();
      if (v !== "true" && v !== "false") {
        return res.status(400).json({
          message: 'Câu hỏi Đúng/Sai phải có correctAnswer là "true" hoặc "false".',
        });
      }
      correctAnswer = v;
      options = [];       // không cần options
      expectedAnswer = "";
      aiAutoGrade = false; // chấm theo correctAnswer
    } else if (type === "short_answer") {
      // short_answer: có 2 chế độ
      // - aiAutoGrade = false → so sánh chuỗi correctAnswer
      // - aiAutoGrade = true  → chấm bằng AI theo correctAnswer làm gợi ý
      if (!correctAnswer && !aiAutoGrade) {
        return res.status(400).json({
          message:
            "Câu hỏi tự luận ngắn cần nhập correctAnswer hoặc bật chế độ AI chấm.",
        });
      }
      options = [];
      expectedAnswer = "";
    } else if (type === "essay") {
      // essay: chấm mở
      options = [];
      correctAnswer = ""; // không dùng correctAnswer cho essay

      if (aiAutoGrade && !expectedAnswer) {
        return res.status(400).json({
          message:
            "Câu hỏi essay bật AI chấm thì cần nhập expectedAnswer (gợi ý đáp án).",
        });
      }
      // nếu không dùng AI, expectedAnswer có thể để trống
    } else if (type === "file_upload") {
      // bài nộp file, luôn chấm tay
      options = [];
      correctAnswer = "";
      expectedAnswer = "";
      aiAutoGrade = false;
    }

    const question = await ExamQuestionBank.create({
      course: b.course,
      createdBy: req.user._id,
      content: b.content,
      type,
      options,
      correctAnswer,
      expectedAnswer,
      score,
      chapter: b.chapter || "",
      difficulty: b.difficulty || "medium",
      tags: b.tags || [],
      aiAutoGrade,
    });

    res.status(201).json(question);
  } catch (err) {
    console.error("❌ createQuestion error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
 * 4. CẬP NHẬT CÂU HỎI
 * PUT /api/admin/exam-questions/:id
 * =======================================================*/
exports.updateQuestion = async (req, res) => {
  try {
    const b = req.body || {};

    const question = await ExamQuestionBank.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // lấy giá trị mới (nếu không gửi thì giữ nguyên)
    const newType = b.type || question.type;
    let newOptions =
      typeof b.options !== "undefined" ? b.options : question.options;
    let newCorrectAnswer =
      typeof b.correctAnswer !== "undefined"
        ? b.correctAnswer
        : question.correctAnswer;
    let newExpectedAnswer =
      typeof b.expectedAnswer !== "undefined"
        ? b.expectedAnswer
        : question.expectedAnswer;
    let newAiAutoGrade =
      typeof b.aiAutoGrade !== "undefined"
        ? !!b.aiAutoGrade
        : !!question.aiAutoGrade;
    let newScore =
      typeof b.score === "number" && b.score > 0
        ? b.score
        : question.score || 1;

    newOptions = Array.isArray(newOptions) ? newOptions : [];

    // ===== VALIDATE THEO TYPE =====
    if (newType === "multiple_choice") {
      if (!newOptions.length || newOptions.length < 2) {
        return res.status(400).json({
          message: "Câu hỏi trắc nghiệm cần tối thiểu 2 phương án.",
        });
      }
      const hasCorrect = newOptions.some((o) => o && o.isCorrect);
      if (!hasCorrect) {
        return res.status(400).json({
          message: "Câu hỏi trắc nghiệm phải có ít nhất 1 đáp án đúng.",
        });
      }
      newCorrectAnswer = "";
      newExpectedAnswer = "";
      newAiAutoGrade = false;
    } else if (newType === "true_false") {
      const v = (newCorrectAnswer || "")
        .toString()
        .trim()
        .toLowerCase();
      if (v !== "true" && v !== "false") {
        return res.status(400).json({
          message: 'Câu hỏi Đúng/Sai phải có correctAnswer là "true" hoặc "false".',
        });
      }
      newCorrectAnswer = v;
      newOptions = [];
      newExpectedAnswer = "";
      newAiAutoGrade = false;
    } else if (newType === "short_answer") {
      if (!newCorrectAnswer && !newAiAutoGrade) {
        return res.status(400).json({
          message:
            "Câu hỏi tự luận ngắn cần nhập correctAnswer hoặc bật chế độ AI chấm.",
        });
      }
      newOptions = [];
      newExpectedAnswer = "";
    } else if (newType === "essay") {
      newOptions = [];
      newCorrectAnswer = "";
      if (newAiAutoGrade && !newExpectedAnswer) {
        return res.status(400).json({
          message:
            "Câu hỏi essay bật AI chấm thì cần nhập expectedAnswer (gợi ý đáp án).",
        });
      }
    } else if (newType === "file_upload") {
      newOptions = [];
      newCorrectAnswer = "";
      newExpectedAnswer = "";
      newAiAutoGrade = false;
    }

    // GÁN LẠI VÀ LƯU
    question.content = b.content ?? question.content;
    question.type = newType;
    question.options = newOptions;
    question.correctAnswer = newCorrectAnswer;
    question.expectedAnswer = newExpectedAnswer;
    question.score = newScore;
    question.chapter = b.chapter ?? question.chapter;
    question.difficulty = b.difficulty ?? question.difficulty;
    question.tags = b.tags ?? question.tags;
    question.aiAutoGrade = newAiAutoGrade;

    await question.save();
    res.json(question);
  } catch (err) {
    console.error("❌ updateQuestion error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
 * 5. XOÁ CÂU HỎI
 * DELETE /api/admin/exam-questions/:id
 * =======================================================*/
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await ExamQuestionBank.findByIdAndDelete(
      req.params.id
    );
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.json({ message: "Question deleted" });
  } catch (err) {
    console.error("❌ deleteQuestion error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================================
 * 6. IMPORT TỪ EXCEL / CSV
 * POST /api/admin/exam-questions/import
 * body: course, (optional) defaultChapter
 * file: field name = "file"
 * =======================================================*/
exports.importQuestions = async (req, res) => {
  try {
    const courseId = req.body.course || req.query.course;
    const defaultChapter = req.body.defaultChapter || "";

    if (!courseId) {
      return res.status(400).json({ message: "Thiếu course khi import." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Không có file upload." });
    }

    const courseExists = await Course.findById(courseId).select("_id");
    if (!courseExists) {
      return res.status(400).json({ message: "Khoá học không tồn tại." });
    }

    const filename = req.file.originalname.toLowerCase();
    let rows = [];

    if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
      const wb = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    } else if (filename.endsWith(".csv")) {
      const content = req.file.buffer.toString("utf8");
      rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else {
      return res
        .status(400)
        .json({ message: "Chỉ hỗ trợ file .xlsx, .xls hoặc .csv" });
    }

    if (!rows.length) {
      return res.status(400).json({ message: "File không có dữ liệu." });
    }

    const docs = [];

    for (const row of rows) {
      const content = (row.content || row.Content || "").toString().trim();
      if (!content) continue;

      let type = (row.type || row.Type || "multiple_choice")
        .toString()
        .trim()
        .toLowerCase();

      if (
        ![
          "multiple_choice",
          "true_false",
          "short_answer",
          "essay",
          "file_upload",
        ].includes(type)
      ) {
        type = "multiple_choice";
      }

      const rawOptions =
        row.options || row.Options || row.option || row.Option || "";
      const rawCorrect = (row.correct || row.Correct || "").toString().trim();
      const rawDifficulty = (row.difficulty || row.Difficulty || "")
        .toString()
        .trim()
        .toLowerCase();
      const rawTags = (row.tags || row.Tags || "").toString();
      const rawScore = row.score || row.Score;
      const rawExpected =
        (row.expectedAnswer || row.ExpectedAnswer || "").toString().trim();
      const rawAi =
        row.aiAutoGrade ||
        row.AIAutoGrade ||
        row.ai ||
        row.AI ||
        "";

      let options = [];
      let correctAnswer = rawCorrect;
      let expectedAnswer = rawExpected;
      let aiAutoGrade = false;

      // === options & đáp án ===
      if (type === "multiple_choice") {
        const parts = rawOptions
          .toString()
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);

        const correctUpper = rawCorrect.toUpperCase();
        options = parts.map((text, idx) => {
          const letter = String.fromCharCode(65 + idx); // A,B,C,...
          const isCorrect =
            correctUpper === letter.toUpperCase() ||
            correctUpper === text.toUpperCase();
          return { text, isCorrect };
        });

        correctAnswer = "";
        expectedAnswer = "";
        aiAutoGrade = false;
      } else if (type === "true_false") {
        const v = rawCorrect.toLowerCase();
        correctAnswer = v === "false" ? "false" : "true";
        options = [];
        expectedAnswer = "";
        aiAutoGrade = false;
      } else if (type === "short_answer") {
        // có thể dùng correctAnswer và bật AI nếu cột aiAutoGrade = true
        aiAutoGrade =
          String(rawAi).toLowerCase() === "true" ||
          rawAi === 1 ||
          rawAi === "1";
        options = [];
        expectedAnswer = "";
      } else if (type === "essay") {
        options = [];
        // essay dùng expectedAnswer làm gợi ý, nếu không có thì bỏ trống
        correctAnswer = "";
        if (rawExpected) {
          expectedAnswer = rawExpected;
        }
        aiAutoGrade =
          String(rawAi).toLowerCase() === "true" ||
          rawAi === 1 ||
          rawAi === "1";
      } else if (type === "file_upload") {
        options = [];
        correctAnswer = "";
        expectedAnswer = "";
        aiAutoGrade = false;
      }

      const chapter =
        (row.chapter || row.Chapter || defaultChapter || "").toString().trim();

      let difficulty = rawDifficulty || "medium";
      if (!["easy", "medium", "hard"].includes(difficulty)) {
        difficulty = "medium";
      }

      let tags = [];
      if (rawTags) {
        tags = rawTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }

      let score = parseFloat(rawScore);
      if (!Number.isFinite(score) || score <= 0) score = 1;

      docs.push({
        course: courseId,
        createdBy: req.user._id,
        content,
        type,
        options,
        correctAnswer,
        expectedAnswer,
        score,
        chapter,
        difficulty,
        tags,
        aiAutoGrade,
      });
    }

    if (!docs.length) {
      return res
        .status(400)
        .json({ message: "Không có dòng hợp lệ nào trong file." });
    }

    const inserted = await ExamQuestionBank.insertMany(docs);
    res.json({
      message: `Import thành công ${inserted.length} câu hỏi.`,
      inserted: inserted.length,
    });
  } catch (err) {
    console.error("❌ importQuestions error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
