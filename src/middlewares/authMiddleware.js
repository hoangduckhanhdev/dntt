const jwt = require("jsonwebtoken");
const User = require("../models/User");
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.query.token) {
      token = req.query.token;
      console.log(" Token từ query:", token);
    }
    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token từ header:", token);
    }
    if (!token) {
      console.log("Không tìm thấy token!");
      return res.status(401).json({
        success: false,
        message: "Không được phép truy cập — thiếu token",
        code: "NO_TOKEN",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(" Token giải mã:", decoded);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.log(" User không tồn tại!");
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại hoặc đã bị xóa",
        code: "USER_NOT_FOUND",
      });
    }
    req.user = { _id: user._id, role: user.role };
    req.userDoc = user;
    next();
  } catch (err) {
    console.error(" Lỗi middleware protect:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "jwt expired",
        code: "TOKEN_EXPIRED",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
      code: "TOKEN_INVALID",
    });
  }
};
exports.admin = (req, res, next) => {
  if (req.userDoc && req.userDoc.role === "admin") return next();
  return res.status(403).json({
    success: false,
    message: "Yêu cầu quyền quản trị (Admin)",
  });
};
exports.adminOrTeacher = (req, res, next) => {
  const role = (req.userDoc?.role || "").toLowerCase();
  console.log("👤 adminOrTeacher check:", {
    id: req.userDoc?._id?.toString(),
    role,
  });
  if (role === "admin" || role === "teacher") return next();
  return res.status(403).json({
    success: false,
    message: "Chỉ giáo viên hoặc admin mới có quyền truy cập",
  });
};
