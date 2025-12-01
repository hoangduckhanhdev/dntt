// middlewares/requireAuth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function requireAuth(req, res, next) {
  try {
    const auth =
      req.headers.authorization ||
      req.headers["x-access-token"] ||
      "";
    const token = String(auth).startsWith("Bearer ")
      ? auth.slice(7)
      : (auth || null);

    if (!token) {
      return res.status(401).json({ message: "Vui lòng đăng nhập để tiếp tục." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded._id)
      .select("_id name email role")
      .lean();

    if (!user) {
      return res.status(401).json({ message: "Phiên đăng nhập không hợp lệ." });
    }

    req.user = {
      _id: user._id,
      role: String(user.role || "user").toLowerCase(),
      name: user.name,
      email: user.email,
    };
    next();
  } catch (e) {
    return res.status(401).json({ message: "Xác thực thất bại. Vui lòng đăng nhập lại." });
  }
};
