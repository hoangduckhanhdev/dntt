const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const {
  startExam,
  autoSaveExam,
  submitExam,
  getMyAttempts,
} = require("../controllers/examController");

// Tất cả API đều yêu cầu đăng nhập
router.use(protect);

// 🚀 Bắt đầu làm bài (resume hoặc tạo attempt mới)
router.get("/:examId/start", startExam);

// 💾 Auto-save khi Học viên chọn đáp án
router.patch("/:examId/attempt", autoSaveExam);

// 📤 Học viên nộp bài thi
router.post("/:examId/submit", submitExam);

// 📊 Xem lịch sử các lần làm bài
router.get("/:examId/my-attempts", getMyAttempts);

module.exports = router;
