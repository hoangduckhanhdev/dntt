// src/routes/admin/adminCourseRoutes.js
const express = require("express");
const router = express.Router();

const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getDropdowns,

  // 👇 thêm các hàm mới cho Teacher/Admin
  getCourseStudents,
  getStudentProgress,
  getCourseQuestions,
  answerCourseQuestion,
  getCourseClasses, // ✅ thêm
} = require("../../controllers/admin/adminCourseController");

const { protect, adminOrTeacher } = require("../../middlewares/authMiddleware");
const upload = require("../../middlewares/upload");

// 🔹 dropdown: cho cả admin + teacher (để teacher cũng tạo/sửa khóa học được)
router.get("/dropdowns", protect, adminOrTeacher, getDropdowns);

// 🔹 danh sách khóa học: admin + teacher
router.get("/", protect, adminOrTeacher, getAllCourses);

// 🔹 Lấy chi tiết 1 khóa
router.get("/:id", protect, adminOrTeacher, getCourse);

// 🔹 Danh sách LỚP của 1 khóa (cho form tạo đề thi)
//    GET /api/admin/courses/:id/classes
router.get("/:id/classes", protect, adminOrTeacher, getCourseClasses);

// 🔹 Tạo khóa học (admin + teacher)
router.post("/", protect, adminOrTeacher, upload.single("image"), createCourse);

// 🔹 Cập nhật khóa học (admin + teacher)
router.put("/:id", protect, adminOrTeacher, upload.single("image"), updateCourse);

// 🔹 Xoá khóa học (admin + teacher – controller tự kiểm tra quyền sở hữu)
router.delete("/:id", protect, adminOrTeacher, deleteCourse);

// 🔹 Danh sách học viên của 1 khóa
router.get("/:id/students", protect, adminOrTeacher, getCourseStudents);

// 🔹 Tiến độ chi tiết của 1 học viên trong khóa
router.get("/:id/students/:userId/progress", protect, adminOrTeacher, getStudentProgress);

// 🔹 Danh sách câu hỏi của 1 khóa
router.get("/:id/questions", protect, adminOrTeacher, getCourseQuestions);

// 🔹 Trả lời câu hỏi
router.post(
  "/:id/questions/:questionId/answer",
  protect,
  adminOrTeacher,
  answerCourseQuestion
);

module.exports = router;
