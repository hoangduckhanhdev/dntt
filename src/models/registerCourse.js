const mongoose = require("mongoose");

const RegisterCourseSchema = new mongoose.Schema(
  {
    // 🔥 BẮT BUỘC – lưu user để liên kết tiến độ, bài thi, Q&A, v.v.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    studentName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },

    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },

    note: { type: String },
    transactionId: { type: String },
    amount: { type: Number, required: true },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    paymentMethod: { type: String, default: "PayOS" },
    isConfirmed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RegisterCourse ||
  mongoose.model("RegisterCourse", RegisterCourseSchema);
