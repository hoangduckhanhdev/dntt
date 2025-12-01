// middlewares/optionalAuth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function optionalAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers["x-access-token"] || "";
    const token = String(auth).startsWith("Bearer ") ? auth.slice(7) : (auth || null);
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id || decoded._id)
      .select("_id name email role")
      .lean();

    if (user) {
      const role = String(user.role || "user").toLowerCase();
      req.user = { _id: user._id, role, name: user.name, email: user.email };
    }
  } catch (_) {
    // token hỏng/hết hạn -> coi như khách
  }
  next();
};
