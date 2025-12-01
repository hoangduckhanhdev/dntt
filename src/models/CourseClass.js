// src/models/CourseClass.js
const mongoose = require("mongoose");

const courseClassSchema = new mongoose.Schema(
  {
    // Tên lớp: VD: Lớp 12A, Nhóm 1, Ca tối T2–T4
    name: { type: String, required: true, trim: true },

    // Mã lớp: VD: L12A-T2
    code: { type: String, trim: true },

    // Lớp thuộc khóa học nào
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // Lớp do giáo viên nào phụ trách
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // KHÔNG phải Teacher, để login teacher dùng User
      required: true,
    },

    // Danh sách học viên trong lớp
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Học kỳ – tuỳ bạn
    semester: { type: String, trim: true },

    // Năm học
    year: { type: String, trim: true },

    // 🔥 Quan trọng: nếu lớp có bài thi & bài tập
    exams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exam" }],
    homeworks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exam" }], // assignment type
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.CourseClass ||
  mongoose.model("CourseClass", courseClassSchema);
