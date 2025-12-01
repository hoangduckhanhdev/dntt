// ======================= examController.js (FULL, UPDATED) =========================

const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");
const ExamQuestionBank = require("../models/ExamQuestionBank");

// thêm các model để check quyền truy cập
const CourseClass = require("../models/CourseClass");
const RegisterCourse = require("../models/registerCourse");

/* ========= AI ========= */
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ========== Helpers ========== */
const shuffleArray = (arr) => arr.sort(() => Math.random() - 0.5);

/**
 * Tự động chọn câu hỏi theo autoConfig của Exam
 * - Lọc theo: course, chapters, tags
 * - Phân bố độ khó: easy / medium / hard (nếu cấu hình)
 * - Nếu thiếu câu thì bù thêm từ pool còn lại
 * - Hỗ trợ nhiều kiểu cấu trúc autoConfig để tránh lệch key giữa FE/BE
 */
async function autoGenerateExamQuestions(exam) {
  const cfg = exam.autoConfig || {};

  // ----- 1. Lọc ngân hàng câu hỏi theo course + chapters + tags -----
  const filter = { course: exam.course };

  const chapters = Array.isArray(cfg.chapters) ? cfg.chapters : [];
  const tags = Array.isArray(cfg.tags) ? cfg.tags : [];

  if (chapters.length) filter.chapter = { $in: chapters };
  if (tags.length) filter.tags = { $in: tags };

  let allQuestions = await ExamQuestionBank.find(filter).lean();

  // Nếu filter quá chặt không có câu nào, fallback về tất cả câu theo course
  if (!allQuestions.length) {
    allQuestions = await ExamQuestionBank.find({
      course: exam.course,
    }).lean();
  }

  if (!allQuestions.length) return []; // thực sự không có câu hỏi nào

  // ----- 2. Đọc cấu hình số câu & phân bố độ khó -----
  const totalQuestions =
    Number(
      cfg.totalQuestions ??
        cfg.total ??
        cfg.count ??
        0
    ) || 0;

  // Hỗ trợ cả autoConfig.difficultyDistribution
  // lẫn các field easyCount/mediumCount/hardCount (hoặc de/tb/kho)
  const distCfg =
    cfg.difficultyDistribution || {
      easy: Number(cfg.easyCount ?? cfg.easy ?? cfg.de ?? 0) || 0,
      medium: Number(cfg.mediumCount ?? cfg.medium ?? cfg.tb ?? 0) || 0,
      hard: Number(cfg.hardCount ?? cfg.hard ?? cfg.kho ?? 0) || 0,
    };

  const diffEasy = Number(distCfg.easy || 0);
  const diffMedium = Number(distCfg.medium || 0);
  const diffHard = Number(distCfg.hard || 0);
  const sumDist = diffEasy + diffMedium + diffHard;

  // Nếu không nhập totalQuestions thì mặc định = tổng phân bố độ khó
  // hoặc = tổng số câu hiện có (lấy hết) nếu phân bố = 0
  const targetTotal =
    totalQuestions || (sumDist > 0 ? sumDist : allQuestions.length);

  const usedIds = new Set();
  let selected = [];

  const pickFrom = (list, count) => {
    if (!count || !list.length) return;
    const shuffled = shuffleArray([...list]);
    for (const q of shuffled) {
      const idStr = String(q._id);
      if (!usedIds.has(idStr)) {
        selected.push(q);
        usedIds.add(idStr);
        if (selected.length >= count) break;
      }
    }
  };

  // ----- 3. Nếu có cấu hình phân bố độ khó thì ưu tiên rút theo độ khó -----
  if (sumDist > 0) {
    const easyQs = allQuestions.filter((q) => q.difficulty === "easy");
    const mediumQs = allQuestions.filter((q) => q.difficulty === "medium");
    const hardQs = allQuestions.filter((q) => q.difficulty === "hard");

    pickFrom(easyQs, diffEasy);
    pickFrom(mediumQs, diffMedium);
    pickFrom(hardQs, diffHard);
  }

  // ----- 4. Nếu vẫn chưa đủ số câu yêu cầu ⇒ bù thêm từ pool còn lại -----
  if (selected.length < targetTotal) {
    const need = targetTotal - selected.length;
    const remainPool = allQuestions.filter(
      (q) => !usedIds.has(String(q._id))
    );
    const shuffledRemain = shuffleArray([...remainPool]);

    for (const q of shuffledRemain) {
      selected.push(q);
      usedIds.add(String(q._id));
      if (selected.length >= targetTotal) break;
    }
  }

  // Cắt bớt nếu lỡ nhiều hơn số câu target (trường hợp tổng phân bố > totalQuestions)
  if (selected.length > targetTotal) {
    selected = shuffleArray([...selected]).slice(0, targetTotal);
  }

  // ----- 5. Fallback cuối: vẫn không có câu nào (trường hợp targetTotal = 0) -----
  if (!selected.length && allQuestions.length) {
    selected.push(
      allQuestions[Math.floor(Math.random() * allQuestions.length)]
    );
  }

  return selected;
}

/** KIỂM TRA QUYỀN SINH VIÊN */
async function canStudentAccessExam(userId, exam) {
  if (!exam) return false;

  // public_practice: ai có link + login đều làm được
  if (exam.accessMode === "public_practice") return true;

  const reg = await RegisterCourse.findOne({
    courseId: exam.course,
    userId,
    paymentStatus: "paid",
  }).lean();

  if (!reg) return false;

  // Nếu không gán lớp cụ thể thì mọi HV trong course đều làm được
  if (!exam.assignedClasses || exam.assignedClasses.length === 0) return true;

  const countClass = await CourseClass.countDocuments({
    _id: { $in: exam.assignedClasses },
    students: userId,
  });

  return countClass > 0;
}

/* ========= AI chấm tự luận ========= */
async function autoGradeEssayAI(question, studentAnswer) {
  try {
    const prompt = `
Bạn là giáo viên. Hãy chấm điểm bài tự luận.

CÂU HỎI:
${question.content}

ĐÁP ÁN (nếu có):
${question.correctAnswer || "Không có đáp án chuẩn"}

BÀI LÀM CỦA HỌC VIÊN:
${studentAnswer || "(Không có bài làm)"}

Điểm tối đa: ${question.score}

Hãy trả kết quả theo định dạng JSON:
{
  "score": số điểm từ 0 đến ${question.score},
  "comment": "nhận xét ngắn gọn"
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content;
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const jsonText = raw.substring(jsonStart, jsonEnd + 1);

    return JSON.parse(jsonText);
  } catch (err) {
    console.error("Lỗi AI essay:", err);
    return { score: 0, comment: "AI không chấm được" };
  }
}

/* ========= AUTO GRADE FULL (TRẮC NGHIỆM + AI ESSAY) ========= */
async function autoGradeAttempt(attempt) {
  let total = 0;
  let maxTotal = 0;

  for (const ans of attempt.answers) {
    const q = await ExamQuestionBank.findById(ans.question);
    if (!q) continue;

    ans.maxScore = q.score || 0;

    /* TRẮC NGHIỆM */
    if (q.type === "multiple_choice") {
      ans.autoGraded = true;
      const correctIds = q.options
        .filter((o) => o.isCorrect)
        .map((o) => String(o._id));
      const student = (ans.selectedOptionIds || []).map(String);

      const ok =
        correctIds.length === student.length &&
        correctIds.every((id) => student.includes(id));

      ans.score = ok ? q.score : 0;
    }

    /* Đúng / Sai */
    else if (q.type === "true_false") {
      ans.autoGraded = true;
      ans.score =
        (ans.answerText || "").trim().toLowerCase() ===
        (q.correctAnswer || "").trim().toLowerCase()
          ? q.score
          : 0;
    }

    /* Short answer */
    else if (q.type === "short_answer") {
      if (q.aiAutoGrade) {
        const ai = await autoGradeEssayAI(q, ans.answerText);
        ans.score = ai.score;
        ans.teacherComment = ai.comment;
        ans.autoGraded = true;
      } else {
        ans.autoGraded = true;
        ans.score =
          (ans.answerText || "").trim().toLowerCase() ===
          (q.correctAnswer || "").trim().toLowerCase()
            ? q.score
            : 0;
      }
    }

    /* ESSAY – tự luận mở */
    else if (q.type === "essay") {
      if (q.aiAutoGrade) {
        const ai = await autoGradeEssayAI(q, ans.answerText);
        ans.score = ai.score;
        ans.teacherComment = ai.comment;
        ans.autoGraded = true;
      } else {
        ans.score = 0;
        ans.autoGraded = false; // giáo viên chấm
      }
    }

    /* FILE – luôn chấm tay */
    else if (q.type === "file_upload") {
      ans.autoGraded = false;
      ans.score = 0;
    }

    total += ans.score || 0;
    maxTotal += ans.maxScore || 0;
  }

  attempt.totalScore = total;
  attempt.maxScore = maxTotal;
}

/* ================== START EXAM ================== */
exports.startExam = async (req, res) => {
  try {
    const examId = req.params.examId;
    const userId = req.user._id;

    const now = new Date();
    const exam = await Exam.findById(examId).populate("questions");

    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (!exam.isPublished)
      return res.status(403).json({ message: "Exam not published" });

    if (exam.startAt && now < exam.startAt)
      return res.status(400).json({ message: "Đề thi chưa mở" });

    if (exam.dueAt && now > exam.dueAt)
      return res.status(400).json({ message: "Đề thi đã hết hạn" });

    const allowed = await canStudentAccessExam(userId, exam);
    if (!allowed)
      return res
        .status(403)
        .json({ message: "Bạn không có quyền làm bài thi này" });

    /* tìm attempt đang làm */
    let attempt = await ExamAttempt.findOne({
      exam: examId,
      student: userId,
      status: "in_progress",
    });

    /* nếu có timeLimit mà hết giờ */
    if (attempt && exam.timeLimit && exam.timeLimit > 0) {
      const elapsed = now - attempt.startedAt;
      const limit = exam.timeLimit * 60 * 1000;

      if (elapsed >= limit) {
        await autoGradeAttempt(attempt);
        attempt.status = "timeout";
        attempt.submittedAt = now;
        await attempt.save();
        attempt = null;
      }
    }

    /* nếu answers rỗng → xoá attempt */
    if (attempt && (!attempt.answers || attempt.answers.length === 0)) {
      const hasQuestionConfig =
        exam.selectionMode === "auto" ||
        (exam.selectionMode === "manual" && exam.questions.length > 0);

      if (hasQuestionConfig) {
        await ExamAttempt.deleteOne({ _id: attempt._id });
        attempt = null;
      }
    }

    /* tạo attempt mới */
    if (!attempt) {
      const count = await ExamAttempt.countDocuments({
        exam: examId,
        student: userId,
      });
      if (count >= exam.attemptsAllowed)
        return res.status(400).json({ message: "Bạn đã hết lượt làm bài" });

      let questionsDocs = [];

      if (exam.selectionMode === "auto") {
        questionsDocs = await autoGenerateExamQuestions(exam);
      } else {
        questionsDocs = exam.questions || [];
      }

      if (!questionsDocs.length)
        return res
          .status(400)
          .json({ message: "Đề thi chưa có câu hỏi" });

      const questionIds = questionsDocs.map((q) => q._id || q);
      questionsDocs = await ExamQuestionBank.find({ _id: { $in: questionIds } });

      if (!questionsDocs.length)
        return res
          .status(400)
          .json({ message: "Không tìm thấy câu hỏi hợp lệ" });

      if (exam.shuffleQuestions) {
        questionsDocs = shuffleArray(questionsDocs);
      }

      const answers = questionsDocs.map((q) => {
        let options = (q.options || []).map((opt) => ({
          optionId: opt._id,
          text: opt.text,
        }));

        if (exam.shuffleOptions && options.length) {
          options = shuffleArray(options);
        }

        return {
          question: q._id,
          questionContent: q.content,
          optionSnapshots: options,
          score: 0,
          maxScore: 0,
        };
      });

      attempt = await ExamAttempt.create({
        exam: examId,
        student: userId,
        attemptIndex: count + 1,
        answers,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }

    /* populate để FE hiển thị */
    await attempt.populate({
      path: "answers.question",
      model: "ExamQuestionBank",
    });

    let remainingSeconds = null;
    if (exam.timeLimit && exam.timeLimit > 0) {
      const elapsed = now - attempt.startedAt;
      const limit = exam.timeLimit * 60 * 1000;
      remainingSeconds = Math.max(0, Math.floor((limit - elapsed) / 1000));
    }

    // 🔥 THÊM course vào object exam trả về để FE dùng làm courseId cho AI
    return res.json({
      attempt,
      exam: {
        _id: exam._id,
        title: exam.title,
        type: exam.type, // quiz | exam | assignment | entry_test
        course: exam.course, // 👈 THÊM DÒNG NÀY
        timeLimit: exam.timeLimit,
        startAt: exam.startAt,
        dueAt: exam.dueAt,
      },
      remainingSeconds,
    });
  } catch (err) {
    console.error("startExam error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================== AUTO SAVE ================== */
exports.autoSaveExam = async (req, res) => {
  try {
    const examId = req.params.examId;
    const userId = req.user._id;

    let incoming = req.body.answers;
    if (!Array.isArray(incoming) && Array.isArray(req.body.answers?.answers)) {
      incoming = req.body.answers.answers;
    }
    if (!Array.isArray(incoming)) incoming = [];

    const attempt = await ExamAttempt.findOne({
      exam: examId,
      student: userId,
      status: "in_progress",
    });

    if (!attempt)
      return res.status(404).json({ message: "Attempt not found" });

    incoming.forEach((inc) => {
      const idx = attempt.answers.findIndex(
        (a) => String(a.question) === String(inc.question)
      );
      if (idx !== -1) {
        attempt.answers[idx].selectedOptionIds =
          inc.selectedOptionIds || [];
        attempt.answers[idx].answerText = inc.answerText || "";
        attempt.answers[idx].fileUrl = inc.fileUrl || "";
      }
    });

    await attempt.save();
    return res.json({ message: "Auto saved" });
  } catch (err) {
    console.error("autoSaveExam error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================== SUBMIT EXAM ================== */
exports.submitExam = async (req, res) => {
  try {
    const examId = req.params.examId;
    const userId = req.user._id;

    const now = new Date();
    const exam = await Exam.findById(examId);

    if (!exam)
      return res.status(404).json({ message: "Exam not found" });

    if (exam.dueAt && now > exam.dueAt)
      return res.status(400).json({ message: "Đã quá hạn nộp bài" });

    const attempt = await ExamAttempt.findOne({
      exam: examId,
      student: userId,
      status: "in_progress",
    });

    if (!attempt)
      return res.status(404).json({ message: "Attempt not found" });

    await autoGradeAttempt(attempt);

    attempt.status = "submitted";
    attempt.submittedAt = now;

    await attempt.save();
    return res.json({ message: "Nộp bài thành công", attempt });
  } catch (err) {
    console.error("submitExam error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================== GET MY ATTEMPTS ================== */
exports.getMyAttempts = async (req, res) => {
  try {
    const examId = req.params.examId;
    const userId = req.user._id;

    const attempts = await ExamAttempt.find({
      exam: examId,
      student: userId,
      status: { $in: ["submitted", "graded", "timeout"] },
    })
      .sort({ attemptIndex: -1 })
      .populate(
        "exam",
        "title type showScoreToStudent showCorrectAnswers revealAnswersMode timeLimit startAt dueAt"
      )
      .populate({
        path: "answers.question",
        model: "ExamQuestionBank",
      });

    return res.json(attempts);
  } catch (err) {
    console.error("getMyAttempts error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ======================= END FILE ===========================
