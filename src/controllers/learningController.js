const Order = require("../models/Order");
const Course = require("../models/Course");
const Progress = require("../models/Progress");
const Question = require("../models/Question");
const ExamAttempt = require("../models/ExamAttempt");
const Exam = require("../models/Exam");
const Skill = require("../models/Skill");
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
const formatQuestion = (q = {}) => ({
  _id: q._id,
  course: q.course,
  content: q.content,
  isResolved: q.isResolved,
  createdAt: q.createdAt,
  updatedAt: q.updatedAt,
  user: q.user || undefined,
  userName: q.userName || q.user?.name || "Học viên",
  answer: q.answer || "",
  answeredBy: q.answeredBy || undefined,
  answeredByName: q.answeredByName || q.answeredBy?.name || "Giảng viên",
  answerAt: q.answerAt || null,
});
exports.getMyCourses = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }
    const orders = await Order.find({
      user: userId,
      status: { $in: ["paid", "completed", "success"] },
    })
      .select("items")
      .lean();
    if (!orders.length) {
      return res.json({ courses: [] });
    }
    const courseIds = [
      ...new Set(
        orders.flatMap((o) => o.items?.map((it) => String(it.course)) || [])
      ),
    ];
    const courses = await Course.find({ _id: { $in: courseIds } })
      .select("_id title image slug description shortDescription level price")
      .lean();
    const progresses = await Progress.find({
      user: userId,
      course: { $in: courseIds },
    })
      .select("course percent")
      .lean();
    const progressMap = new Map(
      progresses.map((p) => [String(p.course), Number(p.percent) || 0])
    );
    const byId = new Map(courses.map((c) => [String(c._id), c]));
    const uniqueOrdered = [];
    const added = new Set();
    courseIds.forEach((id) => {
      const c = byId.get(id);
      if (c && !added.has(id)) {
        uniqueOrdered.push({
          ...c,
          progress: progressMap.get(id) || 0,
        });
        added.add(id);
      }
    });
    res.json({ courses: uniqueOrdered });
  } catch (err) {
    console.error("getMyCourses error:", err);
    res.status(500).json({ message: "Lỗi máy chủ", error: err.message });
  }
};
exports.getCourseQuestionsForLearning = async (req, res) => {
  try {
    const courseId = req.params.id;
    const questions = await Question.find({ course: courseId })
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("answeredBy", "name email")
      .lean();
    res.json({
      questions: questions.map(formatQuestion),
    });
  } catch (err) {
    console.error("getCourseQuestionsForLearning error:", err);
    res.status(500).json({
      message: "Không lấy được danh sách câu hỏi",
      error: err.message,
    });
  }
};
exports.createCourseQuestionForLearning = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user?._id;
    const userDoc = req.userDoc;
    const { content } = req.body;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Vui lòng đăng nhập để đặt câu hỏi." });
    }
    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ message: "Nội dung câu hỏi không được để trống." });
    }
    const question = await Question.create({
      course: courseId,
      user: userId,
      content: content.trim(),
    });
    const populated = await Question.findById(question._id)
      .populate("user", "name email")
      .populate("answeredBy", "name email")
      .lean();
    res.status(201).json({ question: formatQuestion(populated) });
  } catch (err) {
    console.error("createCourseQuestionForLearning error:", err);
    res.status(500).json({
      message: "Không gửi được câu hỏi",
      error: err.message,
    });
  }
};
exports.answerCourseQuestion = async (req, res) => {
  try {
    const courseId = req.params.id;
    const questionId = req.params.questionId;
    const { answer, isResolved } = req.body;
    const user = req.user;
    const userDoc = req.userDoc;
    if (!user?._id) {
      return res.status(401).json({ message: "Vui lòng đăng nhập." });
    }
    if (!["admin", "teacher"].includes(user.role)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền trả lời câu hỏi." });
    }
    if (!answer || !answer.trim()) {
      return res
        .status(400)
        .json({ message: "Nội dung trả lời không được để trống." });
    }
    const question = await Question.findOne({
      _id: questionId,
      course: courseId,
    });
    if (!question) {
      return res.status(404).json({ message: "Không tìm thấy câu hỏi." });
    }
    question.answer = answer.trim();
    question.answeredBy = user._id;
    question.answeredByName =
      userDoc?.name || userDoc?.email || "Giảng viên";
    question.answerAt = new Date();
    question.isResolved =
      typeof isResolved === "boolean" ? isResolved : true;
    await question.save();
    const populated = await Question.findById(question._id)
      .populate("user", "name email")
      .populate("answeredBy", "name email")
      .lean();
    res.json({ question: formatQuestion(populated) });
  } catch (err) {
    console.error("answerCourseQuestion error:", err);
    res.status(500).json({
      message: "Không trả lời được câu hỏi",
      error: err.message,
    });
  }
};
exports.analyzeAttempt = async (req, res) => {
  try {
    const attemptId = req.params.attemptId;
    const userId = req.user._id;
    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      student: userId
    })
      .populate({
        path: "answers.question",
        model: "ExamQuestionBank",
        populate: { path: "skills", model: "Skill" }
      })
      .populate({
        path: "exam",
        model: "Exam",
        populate: { path: "course", model: "Course" }
      });
    if (!attempt)
      return res.status(404).json({ message: "Không tìm thấy bài làm." });
    const skillScores = {};
    attempt.answers.forEach((ans) => {
      const q = ans.question;
      if (!q || !q.skills) return;
      q.skills.forEach((sk) => {
        if (!skillScores[sk.name]) {
          skillScores[sk.name] = { correct: 0, total: 0 };
        }
        skillScores[sk.name].total += q.score || 1;
        skillScores[sk.name].correct += ans.score || 0;
      });
    });
    let skillSummary = "";
    Object.keys(skillScores).forEach((sk) => {
      const sc = skillScores[sk];
      const percent = Math.round((sc.correct / sc.total) * 100);
      skillSummary += `- ${sk}: ${percent}%\n`;
    });
    const prompt = `
Phân tích kết quả học viên theo từng kỹ năng:
${skillSummary}
Hãy tạo báo cáo gồm:
1) Kỹ năng còn yếu
2) Kỹ năng nên ôn lại
3) Gợi ý học tập
4) Sơ đồ tư duy JSON dạng cây (mindmap)
Trả về JSON:
{
 "weakSkills": [...],
 "shouldReview": [...],
 "advice": [...],
 "mindmap": {...}
}
`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });
    const raw = completion.choices[0].message.content;
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const aiJSON = JSON.parse(raw.substring(jsonStart, jsonEnd + 1));
    return res.json({
      attemptId,
      examTitle: attempt.exam.title,
      skillScores,
      ...aiJSON
    });
  } catch (err) {
    console.error("analyzeAttempt error", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
