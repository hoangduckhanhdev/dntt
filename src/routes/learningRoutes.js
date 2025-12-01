// src/routes/learningRoutes.js
const express = require("express");
const router = express.Router();

// Middleware xác thực
const { protect, adminOrTeacher } = require("../middlewares/authMiddleware");

// Controller chính của Learning
const learningController = require("../controllers/learningController");

// Controller AI phân tích kỹ năng
const aiAnalyzer = require("../controllers/aiLearningAnalyzerController");

/* =====================================
 *  KHOÁ HỌC CỦA TÔI
 * ===================================== */
router.get("/my-courses", protect, learningController.getMyCourses);

/* =====================================
 *  Q&A TRONG KHOÁ HỌC
 * ===================================== */

/**
 * Lấy danh sách câu hỏi của 1 khoá học
 * GET /api/learning/courses/:id/questions
 */
router.get(
  "/courses/:id/questions",
  protect,
  learningController.getCourseQuestionsForLearning
);

/**
 * Học viên gửi câu hỏi
 * POST /api/learning/courses/:id/questions
 */
router.post(
  "/courses/:id/questions",
  protect,
  learningController.createCourseQuestionForLearning
);

/**
 * Giáo viên / Admin trả lời câu hỏi
 * PATCH /api/learning/courses/:id/questions/:questionId/answer
 */
router.patch(
  "/courses/:id/questions/:questionId/answer",
  protect,
  adminOrTeacher,
  learningController.answerCourseQuestion
);

/* =====================================
 *  AI PHÂN TÍCH BÀI THI + SƠ ĐỒ TƯ DUY
 * ===================================== */

/**
 * Phân tích dữ liệu bài thi → tính điểm skill → đánh giá AI → mindmap JSON
 * GET /api/learning/analyze/:attemptId
 */
router.get(
  "/analyze/:attemptId",
  protect,
  aiAnalyzer.analyzeLearningAfterExam
);

/**
 * Tạo hình ảnh sơ đồ tư duy (PNG)
 * GET /api/learning/mindmap-image/:attemptId
 */
router.get(
  "/mindmap-image/:attemptId",
  protect,
  aiAnalyzer.generateMindmapImage
);

module.exports = router;
