const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { register, login, forgotPassword, resetPassword } = require("../controllers/authController");

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
  passport.authenticate("google", { session: false, failureRedirect: "http://localhost:5173/login" }),
  (req, res) => {
    try {
      // ✅ Tạo JWT token
      const token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // ✅ Gửi token về frontend (qua query string)
      res.redirect(`http://localhost:5173?token=${token}`);
    } catch (err) {
      console.error("JWT Error:", err);
      res.redirect("http://localhost:5173/login?error=token_failed");
    }
  }
);

module.exports = router;
