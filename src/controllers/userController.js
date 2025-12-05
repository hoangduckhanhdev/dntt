// controllers/userController.js
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// 🟢 Lấy hồ sơ
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.user;
    if (!userId) {
      console.error("❌ getProfile: req.user không có id:", req.user);
      return res
        .status(401)
        .json({ message: "Không xác thực được người dùng" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      console.error("❌ getProfile: không tìm thấy user với id:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error("❌ getProfile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Cập nhật hồ sơ + upload avatar / cover
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.user;

    if (!userId) {
      console.error("❌ updateProfile: req.user không có id:", req.user);
      return res
        .status(401)
        .json({ message: "Không xác thực được người dùng" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error("❌ updateProfile: không tìm thấy user với id:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Các field text cho phép update
    const updatable = [
      "name",
      "phone",
      "address",
      "bio",
      "company",
      "jobTitle",
      "website",
      "facebook",
      "linkedin",
      "gender",
      "zalo",
      "github",
      "goal",
      "interests",
      "learningStyle",
      "birthday",
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        // nếu birthday là chuỗi rỗng thì bỏ qua
        if (field === "birthday" && req.body[field] === "") return;
        user[field] = req.body[field];
      }
    });

    // skills: nhận từ FormData (string "HTML,CSS" hoặc JSON string)
    if (req.body.skills) {
      let skills = req.body.skills;

      if (typeof skills === "string") {
        try {
          const parsed = JSON.parse(skills);
          if (Array.isArray(parsed)) {
            skills = parsed;
          } else {
            skills = skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
        } catch {
          skills = skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }

      user.skills = skills;
    }

    // ========== UPLOAD AVATAR ==========
    if (req.files?.avatar?.[0]) {
      const file = req.files.avatar[0];
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "users/avatars",
        });
        user.avatar = result.secure_url;
      } catch (err) {
        console.error("❌ Cloudinary upload avatar error:", err);
      } finally {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (err) {
          console.error("⚠️ Xóa file avatar tạm lỗi:", err);
        }
      }
    }

    // ========== UPLOAD COVER ==========
    if (req.files?.cover?.[0]) {
      const file = req.files.cover[0];
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "users/covers",
        });
        user.cover = result.secure_url;
      } catch (err) {
        console.error("❌ Cloudinary upload cover error:", err);
      } finally {
        try {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        } catch (err) {
          console.error("⚠️ Xóa file cover tạm lỗi:", err);
        }
      }
    }

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.json({
      message: "🎉 Hồ sơ đã được cập nhật!",
      user: safeUser,
    });
  } catch (error) {
    console.error("❌ updateProfile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
