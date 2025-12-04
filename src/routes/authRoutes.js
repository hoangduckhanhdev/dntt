// routes/auth.js (hoặc tương tự)
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

// 🟠 GOOGLE AUTH
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 🟢 Callback Google — KHÔNG dùng session
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login`, // ✅ dùng FRONTEND_URL
  }),
  (req, res) => {
    try {
      // ✅ Tạo JWT token
      const token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // ✅ Gửi token về đúng frontend (dev hoặc prod)
      res.redirect(`${FRONTEND_URL}/?token=${token}`);
      // Nếu muốn về /login-success:
      // res.redirect(`${FRONTEND_URL}/login-success?token=${token}`);
    } catch (err) {
      console.error("JWT Error:", err);
      res.redirect(`${FRONTEND_URL}/login?error=token_failed`);
    }
  }
);

module.exports = router;
