const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // thông tin học viên
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, trim: true }, // hiển thị nhanh không cần populate

    // nội dung câu hỏi
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // phần giảng viên trả lời
    answer: { type: String, trim: true },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    answeredByName: { type: String, trim: true },
    answerAt: { type: Date },

    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Question || mongoose.model("Question", questionSchema);
