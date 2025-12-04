// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

// 🔗 URL frontend (dev: localhost, prod: Render)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// 🟢 Routes cơ bản
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

/* ======================= GOOGLE LOGIN – BƯỚC 1 ======================= */
// frontend gọi:  GET  /api/auth/google?redirect=/courses  (ví dụ)
router.get("/google", (req, res, next) => {
  const redirect = req.query.redirect || "/";

  passport.authenticate("google", {
    scope: ["profile", "email"],
    // dùng state để mang redirect quay lại callback
    state: encodeURIComponent(redirect),
  })(req, res, next);
});

/* ======================= GOOGLE CALLBACK – BƯỚC 2 ======================= */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login`, // dùng FRONTEND_URL, không hard-code
  }),
  (req, res) => {
    try {
      // lấy lại đường redirect từ state (nếu có)
      const redirectPath = req.query.state
        ? decodeURIComponent(req.query.state)
        : "/";

      // tạo JWT
      const token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // ghép token vào redirectPath
      const sep = redirectPath.includes("?") ? "&" : "?";
      const redirectUrl = `${FRONTEND_URL}${redirectPath}${sep}token=${token}`;

      return res.redirect(redirectUrl);
    } catch (err) {
      console.error("JWT Error:", err);
      return res.redirect(`${FRONTEND_URL}/login?error=token_failed`);
    }
  }
);

module.exports = router;
