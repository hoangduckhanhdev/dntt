export const emitNotification = (req, notif) => {
  try {
    const io = req.app.get("io");
    if (!io) {
      console.warn("Socket.IO chưa được khởi tạo — thông báo không được gửi realtime.");
      return;
    }
    if (notif.userId) {
      io.to(notif.userId.toString()).emit("notification:new", notif);
      console.log(`Gửi thông báo realtime tới user ${notif.userId}: ${notif.title || notif.message}`);
    } else {
      io.emit("notification:new", notif);
      console.log(`Gửi thông báo realtime toàn hệ thống: ${notif.title || notif.message}`);
    }
  } catch (err) {
    console.error("Lỗi khi emit notification:", err);
  }
};
