// backend/src/routes/feedRoutes.js
const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const feedController = require("../controllers/feedController");

/* =========================
   🔔 FEED NOTIFICATIONS
========================= */

// Lấy danh sách thông báo LearnFeed của user hiện tại
router.get(
  "/notifications",
  protect,
  feedController.getNotifications
);

// Đánh dấu 1 thông báo đã đọc
router.patch(
  "/notifications/:id/read",
  protect,
  feedController.readNotification
);

// Đánh dấu tất cả thông báo đã đọc
router.patch(
  "/notifications/read-all",
  protect,
  feedController.readAllNotifications
);

/* =========================
   📌 FEED CHÍNH
========================= */

// Lấy danh sách feed
router.get("/", protect, feedController.getFeed);

// Tạo bài post mới
router.post("/", protect, feedController.createPost);

// Like / Unlike 1 post
router.post("/:id/like", protect, feedController.likePost);

// Thêm comment
router.post("/:id/comments", protect, feedController.commentPost);

// Lấy danh sách comment 1 post
router.get("/:id/comments", protect, feedController.getComments);

// Trả lời mini quiz
router.post("/:id/answer", protect, feedController.answerMiniQuiz);

// Admin ghim / bỏ ghim bài
router.patch("/:id/pin", protect, feedController.pinPost);

// Admin xóa bài
router.delete("/:id", protect, feedController.deletePost);

module.exports = router;
