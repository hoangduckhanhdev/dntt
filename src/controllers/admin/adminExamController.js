// src/controllers/admin/adminExamController.js
const Exam = require("../../models/Exam");
const ExamAttempt = require("../../models/ExamAttempt");
const ExamQuestionBank = require("../../models/ExamQuestionBank");
const CourseClass = require("../../models/CourseClass");

/* =====================================================
   CREATE EXAM
   POST /api/admin/exams
===================================================== */
exports.createExam = async (req, res) => {
  try {
    const b = req.body || {};

    /* --- Validate lớp học (nếu có) --- */
    let classIds = Array.isArray(b.assignedClasses) ? b.assignedClasses : [];

    if (classIds.length > 0) {
      const found = await CourseClass.find({
        _id: { $in: classIds },
        course: b.course, // lớp phải thuộc đúng khoá học
      });

      if (found.length !== classIds.length) {
        return res.status(400).json({
          message: "Một hoặc nhiều lớp không thuộc khoá học này.",
        });
      }
    }

    /* --- Xử lý chọn câu hỏi: manual / auto --- */
    let questions = [];
    let autoConfig = undefined;

    if (b.selectionMode === "manual") {
      // giáo viên đã tick câu hỏi trong FE
      questions = b.questions || [];
    } else if (b.selectionMode === "auto") {
      autoConfig = b.autoConfig || {};

      const count =
        Number(autoConfig.totalQuestions) ||
        Number(autoConfig.count) ||
        0;

      // LƯU Ý: với auto mode, việc random chính thức sẽ diễn ra
      // ở examController.startExam() qua autoGenerateExamQuestions.
      // Đoạn random dưới đây chỉ để "preview" nếu bạn cần,
      // còn đề thi chính vẫn dùng autoConfig.
      if (count > 0) {
        let qs = await ExamQuestionBank.aggregate([
          { $match: { course: b.course } },
          { $sample: { size: count } },
        ]);
        questions = qs.map((q) => q._id);
      }
    }

    /* --- Special rule: Assignment (bài tập về nhà) --- */
    // ❗ Chỉ tắt timeLimit, KHÔNG xoá câu hỏi nữa
    if (b.type === "assignment") {
      b.timeLimit = null; // tính hạn nộp theo dueAt
    }

    const exam = await Exam.create({
      course: b.course,
      createdBy: req.user._id,

      title: b.title,
      description: b.description,

      type: b.type || "quiz", // quiz | exam | assignment

      selectionMode: b.selectionMode || "manual",
      questions,
      autoConfig,

      assignedClasses: classIds,
      accessMode: b.accessMode || "class_only",

      timeLimit: b.type === "assignment" ? null : b.timeLimit ?? 30,
      startAt: b.startAt || null,
      dueAt: b.dueAt || null,

      attemptsAllowed: b.attemptsAllowed ?? 1,
      scoringStrategy: b.scoringStrategy || "highest",

      shuffleQuestions: b.shuffleQuestions ?? true,
      shuffleOptions: b.shuffleOptions ?? true,
      allowResume: b.allowResume ?? true,

      // hiển thị kết quả cho học viên
      showScoreToStudent: b.showScoreToStudent ?? true,
      showCorrectAnswers: b.showCorrectAnswers ?? false,
      revealAnswersMode: b.revealAnswersMode || "after_due",

      isPublished: false,
    });

    // 🔥 Gán đề thi / bài tập vào các lớp tương ứng
    if (classIds.length > 0) {
      if (exam.type === "assignment") {
        // bài tập về nhà
        await CourseClass.updateMany(
          { _id: { $in: classIds } },
          { $addToSet: { homeworks: exam._id } }
        );
      } else {
        // quiz / exam
        await CourseClass.updateMany(
          { _id: { $in: classIds } },
          { $addToSet: { exams: exam._id } }
        );
      }
    }

    res.status(201).json(exam);
  } catch (err) {
    console.error("❌ createExam error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   LIST EXAMS
   GET /api/admin/exams?course=...
===================================================== */
exports.getExams = async (req, res) => {
  try {
    const { course } = req.query;
    const filter = {};

    if (course) filter.course = course;

    // Giáo viên chỉ xem bài thi họ tạo
    if (req.user.role === "teacher") {
      filter.createdBy = req.user._id;
    }

    const exams = await Exam.find(filter)
      .populate("course", "title")
      .populate("assignedClasses", "name code")
      .sort({ createdAt: -1 });

    res.json(exams);
  } catch (err) {
    console.error("❌ getExams error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   EXAM DETAIL
   GET /api/admin/exams/:id
===================================================== */
exports.getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate("course", "title")
      .populate("assignedClasses", "name code year semester")
      .populate({ path: "questions", model: "ExamQuestionBank" });

    if (!exam) return res.status(404).json({ message: "Exam not found" });

    res.json(exam);
  } catch (err) {
    console.error("❌ getExam error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   UPDATE EXAM
   PATCH /api/admin/exams/:id
===================================================== */
exports.updateExam = async (req, res) => {
  try {
    const b = req.body || {};

    // lấy exam trước khi update để xử lý lại mapping lớp
    const examBefore = await Exam.findById(req.params.id);
    if (!examBefore) {
      return res.status(404).json({ message: "Exam not found" });
    }

    let classIds = Array.isArray(b.assignedClasses)
      ? b.assignedClasses
      : [];

    // khoá học dùng để validate lớp
    const courseId = b.course || examBefore.course;

    // validate lớp
    if (classIds.length > 0) {
      const found = await CourseClass.find({
        _id: { $in: classIds },
        course: courseId,
      });

      if (found.length !== classIds.length) {
        return res.status(400).json({
          message: "Một hoặc nhiều lớp không thuộc đúng khoá học.",
        });
      }
    }

    // xử lý autoConfig / questions
    let questions = examBefore.questions;
    let autoConfig = examBefore.autoConfig;

    if (b.selectionMode === "manual") {
      questions = b.questions || [];
      autoConfig = undefined;
    } else if (b.selectionMode === "auto") {
      autoConfig = b.autoConfig || examBefore.autoConfig || {};
      // có thể random lại giống createExam nếu muốn
    }

    const newType = b.type || examBefore.type;
    const isAssignment = newType === "assignment";

    const data = {
      title: b.title,
      description: b.description,
      type: newType,

      selectionMode: b.selectionMode,
      questions,
      autoConfig,

      assignedClasses: classIds,
      accessMode: b.accessMode,

      timeLimit: isAssignment ? null : b.timeLimit,
      startAt: b.startAt,
      dueAt: b.dueAt,

      attemptsAllowed: b.attemptsAllowed,
      scoringStrategy: b.scoringStrategy,

      shuffleQuestions: b.shuffleQuestions,
      shuffleOptions: b.shuffleOptions,
      allowResume: b.allowResume,

      showScoreToStudent: b.showScoreToStudent,
      showCorrectAnswers: b.showCorrectAnswers,
      revealAnswersMode: b.revealAnswersMode,
    };

    const exam = await Exam.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });

    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // 🔥 Cập nhật lại mapping lớp ↔ đề thi / bài tập
    const prevClassIds = (examBefore.assignedClasses || []).map((x) =>
      x.toString()
    );
    const newClassIds = classIds.map((x) => x.toString());

    // Xoá exam khỏi tất cả lớp cũ (cả exams & homeworks)
    if (prevClassIds.length > 0) {
      await CourseClass.updateMany(
        { _id: { $in: prevClassIds } },
        { $pull: { exams: exam._id, homeworks: exam._id } }
      );
    }

    // Gán lại cho lớp mới theo type hiện tại
    if (newClassIds.length > 0) {
      if (exam.type === "assignment") {
        await CourseClass.updateMany(
          { _id: { $in: newClassIds } },
          { $addToSet: { homeworks: exam._id } }
        );
      } else {
        await CourseClass.updateMany(
          { _id: { $in: newClassIds } },
          { $addToSet: { exams: exam._id } }
        );
      }
    }

    res.json(exam);
  } catch (err) {
    console.error("❌ updateExam error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   DELETE
   DELETE /api/admin/exams/:id
===================================================== */
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Xoá attempts
    await ExamAttempt.deleteMany({ exam: exam._id });

    // Gỡ exam / homework khỏi các lớp
    await CourseClass.updateMany(
      {},
      { $pull: { exams: exam._id, homeworks: exam._id } }
    );

    res.json({ message: "Exam deleted" });
  } catch (err) {
    console.error("❌ deleteExam error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   PUBLISH / UNPUBLISH
   PATCH /api/admin/exams/:id/publish
===================================================== */
exports.publishExam = async (req, res) => {
  try {
    const { isPublished } = req.body;

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { isPublished: !!isPublished },
      { new: true }
    );

    if (!exam) return res.status(404).json({ message: "Exam not found" });

    res.json(exam);
  } catch (err) {
    console.error("❌ publishExam error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   ATTEMPT LIST
   GET /api/admin/exams/:id/attempts
===================================================== */
exports.getExamAttempts = async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({ exam: req.params.id })
      .populate("student", "name email")
      .populate("exam", "title type")
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (err) {
    console.error("❌ getExamAttempts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   ATTEMPT DETAIL
   GET /api/admin/exams/:id/attempts/:attemptId
===================================================== */
exports.getAttemptDetail = async (req, res) => {
  try {
    const attempt = await ExamAttempt.findOne({
      _id: req.params.attemptId,
      exam: req.params.id,
    })
      .populate({
        path: "answers.question",
        model: "ExamQuestionBank",
      })
      .populate("exam", "title type");

    if (!attempt)
      return res.status(404).json({ message: "Attempt not found" });

    res.json(attempt);
  } catch (err) {
    console.error("❌ getAttemptDetail error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   GRADE ATTEMPT
   POST /api/admin/exams/:id/attempts/:attemptId/grade
===================================================== */
exports.gradeAttempt = async (req, res) => {
  try {
    const { answers } = req.body;

    const attempt = await ExamAttempt.findOne({
      _id: req.params.attemptId,
      exam: req.params.id,
    });

    if (!attempt)
      return res.status(404).json({ message: "Attempt not found" });

    if (Array.isArray(answers)) {
      let totalScore = 0;
      let maxScore = 0;

      answers.forEach((c) => {
        const idx = attempt.answers.findIndex(
          (a) => String(a.question) === String(c.question)
        );

        if (idx !== -1) {
          const ansDoc = attempt.answers[idx];

          // điểm giáo viên nhập
          ansDoc.score =
            c.score === "" || c.score == null
              ? 0
              : Number(c.score) || 0;

          // maxScore: ưu tiên giữ theo đề thi (autoGrade đã set trước đó)
          if (typeof c.maxScore === "number") {
            ansDoc.maxScore = c.maxScore;
          }
          // nếu FE không gửi maxScore thì giữ nguyên ansDoc.maxScore

          ansDoc.teacherComment = c.teacherComment || ansDoc.teacherComment || "";

          totalScore += ansDoc.score || 0;
          maxScore += ansDoc.maxScore || 0;
        }
      });

      attempt.totalScore = totalScore;
      attempt.maxScore = maxScore;
      attempt.status = "graded";
      attempt.gradedAt = new Date();
    }

    await attempt.save();
    res.json(attempt);
  } catch (err) {
    console.error("❌ gradeAttempt error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
