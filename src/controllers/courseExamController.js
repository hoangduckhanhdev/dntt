// controllers/courseExamController.js
const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");

/**
 * Helper: build summary attempts cho 1 danh sách exam
 * -> để hiển thị trạng thái: đã làm / điểm bao nhiêu / lần mấy
 */
async function buildAttemptSummary(exams, userId) {
  const examIds = exams.map((e) => e._id);
  if (examIds.length === 0) return [];

  const attempts = await ExamAttempt.find({
    exam: { $in: examIds },
    student: userId,
    status: { $in: ["submitted", "graded", "timeout"] },
  })
    .sort({ attemptIndex: -1 }) // lần mới nhất trước
    .lean();

  // map theo examId để lấy attempt mới nhất
  const byExam = {};
  attempts.forEach((a) => {
    const key = String(a.exam);
    if (!byExam[key]) {
      byExam[key] = a; // lần mới nhất
    }
  });

  return exams.map((exam) => {
    const key = String(exam._id);
    const at = byExam[key];
    return {
      examId: exam._id,
      title: exam.title,
      type: exam.type,
      timeLimit: exam.timeLimit,
      startAt: exam.startAt,
      dueAt: exam.dueAt,
      isPublished: exam.isPublished,
      attemptsAllowed: exam.attemptsAllowed,
      scoringStrategy: exam.scoringStrategy,
      // thông tin attempt mới nhất (nếu có)
      latestAttempt: at
        ? {
            status: at.status,
            attemptIndex: at.attemptIndex,
            totalScore: at.totalScore,
            maxScore: at.maxScore,
            submittedAt: at.submittedAt,
          }
        : null,
    };
  });
}

// helper điều kiện thời gian “mở đề” linh hoạt hơn
function buildTimeWindowFilter(now) {
  return {
    $and: [
      {
        $or: [
          { startAt: { $exists: false } },
          { startAt: null },
          { startAt: { $lte: now } },
        ],
      },
      {
        $or: [
          { dueAt: { $exists: false } },
          { dueAt: null },
          { dueAt: { $gte: now } },
        ],
      },
    ],
  };
}

/**
 * GET /api/courses/:courseId/homework
 * -> trả về các bài "assignment" (bài tập về nhà) của khóa học đó + trạng thái của học viên
 */
exports.getCourseHomework = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const now = new Date();

    const homeworks = await Exam.find({
      course: courseId,
      type: "assignment",     // chỉ bài tập về nhà
      isPublished: true,
      ...buildTimeWindowFilter(now),
    })
      .sort({ startAt: 1, createdAt: -1 })
      .lean();

    const summary = await buildAttemptSummary(homeworks, userId);

    res.json({
      items: summary, // mảng các bài tập + trạng thái làm bài
    });
  } catch (err) {
    console.error("getCourseHomework error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/courses/:courseId/exam
 * -> trả về các bài "exam / quiz" của khóa học đó + trạng thái của học viên
 */
exports.getCourseExam = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const now = new Date();

    const exams = await Exam.find({
      course: courseId,
      // 👇 Quan trọng: lấy CẢ exam lẫn quiz
      type: { $in: ["exam", "quiz"] },
      isPublished: true,
      ...buildTimeWindowFilter(now),
    })
      .sort({ startAt: 1, createdAt: -1 })
      .lean();

    const summary = await buildAttemptSummary(exams, userId);

    res.json({
      items: summary, // mảng các bài thi + trạng thái làm bài
    });
  } catch (err) {
    console.error("getCourseExam error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
