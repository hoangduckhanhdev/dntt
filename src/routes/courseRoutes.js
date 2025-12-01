// routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const upload = require("../middlewares/upload");

// middleware
const optionalAuth = require("../middlewares/optionalAuth");
const { protect } = require("../middlewares/authMiddleware");

// Q&A khóa học
const {
  getCourseQuestions,
  createCourseQuestion,
  answerCourseQuestion,
} = require("../controllers/questionController");

// Outline thông minh
const { getCourseOutlineSmart } = require("../controllers/courseController");

// ⭐⭐ IMPORT MỚI — controller homework/exam theo khóa học
const {
  getCourseHomework,
  getCourseExam,
} = require("../controllers/courseExamController");

/* ---------------------------------------------
   CLIENT ROUTES (public & student)
----------------------------------------------*/

// Danh sách theo category
router.get("/", courseController.getCourses);
router.get("/by-category/:categoryId?", courseController.getCoursesByCategory);

// 📌⭐ THÊM ROUTE HOMEWORK / EXAM CỦA KHÓA HỌC (đặt TRƯỚC :id để tránh conflict)
router.get("/:courseId/homework", protect, getCourseHomework);
router.get("/:courseId/exam", protect, getCourseExam);

// Liên quan & reviews
router.get("/:id/related", courseController.getRelatedCourses);
router.get("/:id/reviews", courseController.getReviews);
router.post("/:id/reviews", courseController.addReview);

// Q&A khóa học
router.get("/:courseId/questions", optionalAuth, getCourseQuestions);
router.post("/:courseId/questions", protect, createCourseQuestion);
router.post("/:courseId/questions/:id/answer", protect, answerCourseQuestion);

// Outline có phân quyền
router.get("/:id/outline", optionalAuth, getCourseOutlineSmart);

// Cập nhật curriculum
router.put("/:id/curriculum", courseController.updateCurriculum);

// Chi tiết 1 khoá
router.get("/:id", courseController.getCourseById);

// CRUD (admin/teacher)
router.post("/", upload.single("image"), courseController.createCourse);
router.put("/:id", upload.single("image"), courseController.updateCourse);
router.delete("/:id", courseController.deleteCourse);

module.exports = router;
