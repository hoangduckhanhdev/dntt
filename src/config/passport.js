// src/config/passport.js
require("dotenv").config();
const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

/* ===================== 🔗 BACKEND URL (cho Google callback) ===================== */
// Dùng env khi deploy, fallback localhost khi dev
const backendURL = process.env.BACKEND_URL || "http://localhost:5000";

/* ===================== 🔐 JWT STRATEGY ===================== */
// Lấy token từ header Authorization: Bearer <token>
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || "secret", // phải trùng với secret khi ký token
};

// Strategy tên "jwt" -> dùng cho passport.authenticate("jwt", { session: false })
passport.use(
  "jwt",
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // payload bạn đang log: { id, role, iat, exp }
      const userId = payload.id;

      const user = await User.findById(userId).select("-password");
      if (!user) {
        return done(null, false);
      }

      // gắn user vào req.user
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  })
);

/* ===================== 🌐 GOOGLE OAUTH STRATEGY ===================== */

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // ✅ KHÔNG hard-code localhost nữa
      callbackURL: `${backendURL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 🟢 Tìm user theo googleId trước
        let user = await User.findOne({ googleId: profile.id });

        // 🟠 Nếu chưa có, thử tìm theo email
        if (!user && profile.emails && profile.emails.length > 0) {
          user = await User.findOne({ email: profile.emails[0].value });
        }

        // 🟣 Nếu user tồn tại (đăng ký trước), thêm googleId vào
        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }
          return done(null, user);
        }

        // 🔵 Nếu chưa tồn tại -> tạo mới
        const newUser = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          avatar: profile.photos?.[0]?.value,
          password: "google_oauth_no_password", // đúng như bạn đang dùng
          role: "student", // mặc định học viên
        });

        return done(null, newUser);
      } catch (err) {
        console.error("Google auth error:", err);
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
