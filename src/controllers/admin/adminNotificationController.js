// const { image } = require("../../config/cloudinary"); // tạm không dùng
const Notification = require("../../models/Notification");
const { emitNotification } = require("../../utils/notificationEmitter");

// 👇 thêm các model để phục vụ thông báo theo khóa học
const Course = require("../../models/Course");
const Teacher = require("../../models/Teacher");
const RegisterCourse = require("../../models/registerCourse");

// =====================
// 🔹 Lấy danh sách thông báo của người dùng hiện tại
// =====================
const getNotifications = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Người dùng chưa xác thực." });
    }

    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(notifications);
  } catch (err) {
    console.error("❌ Lỗi khi lấy thông báo:", err);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy thông báo", error: err.message });
  }
};

// =====================
// 🔹 Lấy tất cả thông báo (dành cho Admin Dashboard)
// =====================
const getAllAdminNotifications = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin được phép xem tất cả thông báo!",
      });
    }

    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error("❌ Lỗi khi lấy tất cả thông báo:", err);
    res.status(500).json({
      message: "Lỗi khi lấy tất cả thông báo",
      error: err.message,
    });
  }
};

// =====================
// 🔹 Tạo thông báo mới (admin hoặc giáo viên) – kiểu “chung”
// =====================
const createNotification = async (req, res) => {
  try {
    if (!req.user || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Chỉ admin hoặc giáo viên được phép tạo thông báo!",
      });
    }

    const { title, message, type, userId, link, image } = req.body;
    if (!title || !message) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ tiêu đề và nội dung!" });
    }

    const notif = await Notification.create({
      title,
      message,
      type: type || "info",
      user: userId || req.user._id || null, // nếu userId không truyền thì gửi cho chính người tạo
      link: link || "",
      image: image || "",
      isRead: false,
    });

    // Gửi realtime notification qua socket.io
    emitNotification(req, notif);

    res.status(201).json({ success: true, data: notif });
  } catch (err) {
    console.error("❌ Lỗi khi tạo thông báo:", err);
    res
      .status(500)
      .json({ message: "Lỗi khi tạo thông báo", error: err.message });
  }
};

// =====================
// 🔹 GIÁO VIÊN GỬI THÔNG BÁO CHO HỌC VIÊN 1 KHÓA
// =====================
// POST /api/admin/notifications/course/:courseId
const createCourseNotification = async (req, res) => {
  try {
    if (!req.user || !["admin", "teacher"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Chỉ admin hoặc giáo viên được phép tạo thông báo!",
      });
    }

    const { courseId } = req.params;
    const { title, message, link, image } = req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ tiêu đề và nội dung!" });
    }

    // Lấy thông tin khóa học
    const course = await Course.findById(courseId).select("title teacher");
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học." });
    }

    // Nếu là teacher -> phải là người dạy khóa này
    if (req.user.role === "teacher") {
      const teacher = await Teacher.findOne({ user: req.user._id }).select(
        "_id"
      );
      if (
        !teacher ||
        course.teacher.toString() !== teacher._id.toString()
      ) {
        return res.status(403).json({
          message: "Bạn không có quyền gửi thông báo cho khóa học này.",
        });
      }
    }

    // Lấy danh sách học viên đã đăng ký & thanh toán khóa này
    // ⚠️ Khuyến nghị: RegisterCourse nên có field userId (ref "User")
    const regs = await RegisterCourse.find({
      courseId: courseId,
      paymentStatus: "paid",
    })
      .select("userId studentName email")
      .lean();

    const userIds = regs
      .map((r) => r.userId)
      .filter((id) => !!id);

    if (userIds.length === 0) {
      return res.status(400).json({
        message:
          "Khóa học này hiện chưa có học viên hệ thống (chưa liên kết userId).",
      });
    }

    // Tạo thông báo cho từng user
    const docs = userIds.map((uid) => ({
      title,
      message,
      type: "course",
      user: uid,
      course: courseId,
      link: link || "",
      image: image || "",
      isRead: false,
      createdBy: req.user._id,
    }));

    const created = await Notification.insertMany(docs);

    // bắn realtime cho từng người
    created.forEach((notif) => emitNotification(req, notif));

    res.status(201).json({
      success: true,
      message: "Đã gửi thông báo tới học viên của khóa học.",
      count: created.length,
    });
  } catch (err) {
    console.error("❌ Lỗi khi tạo thông báo theo khóa học:", err);
    res.status(500).json({
      message: "Lỗi server khi tạo thông báo khóa học",
      error: err.message,
    });
  }
};

// 🔧 Cập nhật thông báo: admin + teacher đều sửa được (quyền đã check ở adminOrTeacher)
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;

    // Tùy bạn, có thể giới hạn field cho phép update, ở đây cho phép update mọi field gửi lên
    const updateData = { ...req.body };

    const notif = await Notification.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true } // trả về bản ghi sau khi update
    );

    if (!notif) {
      return res.status(404).json({
        success: false,
        message: "Thông báo không tồn tại",
      });
    }

    return res.json({
      success: true,
      message: "Cập nhật thông báo thành công",
      data: notif,
    });
  } catch (err) {
    console.error("❌ Lỗi updateNotification:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật thông báo",
    });
  }
};


// =====================
// 🔹 Đánh dấu 1 thông báo là đã đọc
// =====================
const markAsRead = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Người dùng chưa xác thực." });
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notif)
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông báo!" });
    res.json(notif);
  } catch (err) {
    console.error("❌ Lỗi khi đánh dấu đã đọc:", err);
    res.status(500).json({
      message: "Lỗi khi cập nhật thông báo",
      error: err.message,
    });
  }
};

// =====================
// 🔹 Đánh dấu tất cả thông báo là đã đọc
// =====================
const markAllAsRead = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Người dùng chưa xác thực." });
    }

    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({
      success: true,
      message: "Tất cả thông báo đã được đánh dấu là đã đọc.",
    });
  } catch (err) {
    console.error("❌ Lỗi khi đánh dấu tất cả đã đọc:", err);
    res.status(500).json({
      message: "Lỗi khi cập nhật thông báo",
      error: err.message,
    });
  }
};

// =====================
// 🔹 Xóa thông báo (Admin)
// =====================
const deleteNotification = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Chỉ admin được phép xóa thông báo!",
      });
    }

    const notif = await Notification.findByIdAndDelete(req.params.id);
    if (!notif)
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông báo!" });

    res.json({ success: true, message: "Đã xóa thông báo." });
  } catch (err) {
    console.error("❌ Lỗi khi xóa thông báo:", err);
    res.status(500).json({
      message: "Lỗi khi xóa thông báo",
      error: err.message,
    });
  }
};

// =====================
// 🔹 Đếm số thông báo chưa đọc
// =====================
const getUnreadCount = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Người dùng chưa xác thực." });
    }

    const count = await Notification.countDocuments({
      user: req.user._id, // ✅ dùng field 'user' cho đúng với các hàm khác
      isRead: false,
    });

    // trả cả count & unread để FE dễ dùng
    res.json({ success: true, count, unread: count });
  } catch (err) {
    console.error("❌ Lỗi khi đếm thông báo chưa đọc:", err);
    res.status(500).json({
      message: "Lỗi khi đếm thông báo",
      error: err.message,
    });
  }
};

module.exports = {
  getNotifications,
  getAllAdminNotifications,
  createNotification,
  createCourseNotification,
  updateNotification, 
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};
