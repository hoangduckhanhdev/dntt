const express = require("express");
const router = express.Router();
const { protect, admin, adminOrTeacher } = require("../../middlewares/authMiddleware");

const {
  getNotifications,
  getAllAdminNotifications,
  createNotification,
  updateNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  createCourseNotification, 
} = require("../../controllers/admin/adminNotificationController");

// 1) Lấy thông báo của user đang đăng nhập (admin + teacher)
router.get("/", protect, adminOrTeacher, getNotifications);

// 2) Admin xem toàn bộ thông báo (GIỮ admin thôi)
router.get("/all", protect, admin, getAllAdminNotifications);

// 3) Đếm số thông báo chưa đọc (admin + teacher)
router.get("/unread-count", protect, adminOrTeacher, getUnreadCount);

// 4) Admin + Teacher tạo thông báo chung
router.post("/", protect, adminOrTeacher, createNotification);

// 5) Admin + Teacher tạo thông báo cho học viên của 1 khóa học
router.post("/course/:courseId", protect, adminOrTeacher, createCourseNotification);

// 6) Admin + Teacher cập nhật nội dung thông báo
router.put("/:id", protect, adminOrTeacher, updateNotification);

// 7) Đánh dấu 1 thông báo đã đọc (admin + teacher)
router.put("/:id/read", protect, adminOrTeacher, markAsRead);

// 8) Đánh dấu tất cả đã đọc (admin + teacher)
router.put("/mark-all-read", protect, adminOrTeacher, markAllAsRead);

// 9) Chỉ admin xóa thông báo
router.delete("/:id", protect, admin, deleteNotification);

module.exports = router;
