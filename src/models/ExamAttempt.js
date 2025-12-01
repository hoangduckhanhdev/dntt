const mongoose = require("mongoose");

/* =====================================================
   ANSWER SCHEMA (Mỗi câu trả lời của học viên)
===================================================== */
const answerSchema = new mongoose.Schema(
  {
    // ID câu hỏi gốc trong ngân hàng
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamQuestionBank",
      required: true
    },

    // Snapshot câu hỏi tại thời điểm làm bài
    questionContent: String,

    // Snapshot phương án (để đảm bảo câu hỏi không thay đổi ảnh hưởng attempt)
    optionSnapshots: [
      {
        _id: false,
        optionId: mongoose.Schema.Types.ObjectId,
        text: String
      }
    ],

    // Với trắc nghiệm → danh sách đáp án học viên chọn
    selectedOptionIds: [{ type: mongoose.Schema.Types.ObjectId }],

    // Với tự luận → text
    answerText: String,

    // Với bài tập / tự luận → file đính kèm
    fileUrl: String,

    // Điểm
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },

    // Đánh dấu hệ thống đã auto-grade chưa
    autoGraded: { type: Boolean, default: false },

    // Nhận xét của giáo viên
    teacherComment: String
  },
  { _id: false }
);

/* =====================================================
   EXAM ATTEMPT SCHEMA (Bài làm của học viên)
===================================================== */
const examAttemptSchema = new mongoose.Schema(
  {
    // đề thi nào
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true
    },

    // học viên nào
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Lần thứ mấy
    attemptIndex: { type: Number, default: 1 },

    // Trạng thái bài làm
    status: {
      type: String,
      enum: ["in_progress", "submitted", "graded", "timeout"],
      default: "in_progress"
    },

    // Thời gian làm
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    gradedAt: Date,

    // Các câu trả lời
    answers: [answerSchema],

    // điểm tổng
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },

    // Log
    ipAddress: String,
    userAgent: String
  },
  { timestamps: true }
);

// đảm bảo mỗi attemptIndex là duy nhất cho mỗi exam/student
examAttemptSchema.index(
  { exam: 1, student: 1, attemptIndex: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.ExamAttempt ||
  mongoose.model("ExamAttempt", examAttemptSchema);
