// utils/hasCourseAccess.js
const mongoose = require("mongoose");
let Order;
try {
  Order = require("../models/Order");
} catch { /* không có Order -> coi như chưa mua */ }

function toObjectId(v) {
  try {
    if (!v) return null;
    // nếu đã là ObjectId
    if (v instanceof mongoose.Types.ObjectId) return v;
    // nếu là chuỗi hợp lệ
    if (mongoose.isValidObjectId(v)) return new mongoose.Types.ObjectId(v);
    return null;
  } catch {
    return null;
  }
}

exports.hasCourseAccess = async function hasCourseAccess(user, course) {
  try {
    // Khách
    if (!user) return false;

    // Lấy id & role an toàn
    const userId = toObjectId(user._id || user.id);
    const role = user.role || "user";

    // Admin / Teacher xem được
    if (role === "admin" || role === "teacher") return true;

    // Học viên: phải có Order (paid) chứa course này
    if (!Order || !userId) return false;

    const courseId = toObjectId(course?._id || course?.id);
    if (!courseId) return false;

    const paid = await Order.findOne({
      user: userId,
      status: "paid",
      "items.course": courseId,
    }).lean();

    return !!paid;
  } catch (e) {
    console.warn("hasCourseAccess error:", e?.message || e);
    return false;
  }
};
