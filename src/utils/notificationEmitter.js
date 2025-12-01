// src/utils/notificationEmitter.js
export const emitNotification = (req, notif) => {
  try {
    const io = req.app.get("io");

    if (!io) {
      console.warn("⚠️ Socket.IO chưa được khởi tạo — thông báo không được gửi realtime.");
      return;
    }

    // Nếu thông báo có userId → chỉ gửi cho user đó
    if (notif.userId) {
      io.to(notif.userId.toString()).emit("notification:new", notif);
      console.log(`📩 Gửi thông báo realtime tới user ${notif.userId}: ${notif.title || notif.message}`);
    } else {
      // Nếu là thông báo chung → gửi toàn hệ thống
      io.emit("notification:new", notif);
      console.log(`📢 Gửi thông báo realtime toàn hệ thống: ${notif.title || notif.message}`);
    }

  } catch (err) {
    console.error("❌ Lỗi khi emit notification:", err);
  }
};
