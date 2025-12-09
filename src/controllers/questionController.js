const Question = require("../models/Question");
function getCourseIdFromParams(params = {}) {
  return params.courseId || params.id;
}
exports.getCourseQuestions = async (req, res) => {
  try {
    const courseId = getCourseIdFromParams(req.params);
    if (!courseId) {
      return res.status(400).json({ message: "Thiếu courseId." });
    }
    const questions = await Question.find({ course: courseId })
      .populate("user", "name avatar email")
      .populate("answeredBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, questions });
  } catch (err) {
    console.error(" getCourseQuestions error:", err);
    res.status(500).json({ message: "Không tải được danh sách câu hỏi." });
  }
};
exports.createCourseQuestion = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res
        .status(401)
        .json({ message: "Vui lòng đăng nhập để gửi câu hỏi." });
    }
    const courseId = getCourseIdFromParams(req.params);
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ message: "Nội dung câu hỏi không được trống." });
    }
    const question = await Question.create({
      course: courseId,
      user: req.user._id,
      content: content.trim(),
    });
    const populated = await question.populate("user", "name avatar");
    res.status(201).json({ success: true, question: populated });
  } catch (err) {
    console.error(" createCourseQuestion error:", err);
    res.status(500).json({ message: "Không gửi được câu hỏi." });
  }
};
exports.answerCourseQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    if (!answer || !answer.trim()) {
      return res
        .status(400)
        .json({ message: "Nội dung trả lời không được trống." });
    }
    const q = await Question.findById(id);
    if (!q) return res.status(404).json({ message: "Không tìm thấy câu hỏi." });
    q.answer = answer.trim();
    q.answeredBy = req.user?._id || null;
    q.isResolved = true;
    await q.save();
    const populated = await q
      .populate("user", "name avatar")
      .populate("answeredBy", "name email");
    res.json({ success: true, question: populated });
  } catch (err) {
    console.error(" answerCourseQuestion error:", err);
    res.status(500).json({ message: "Không thể lưu câu trả lời." });
  }
};
