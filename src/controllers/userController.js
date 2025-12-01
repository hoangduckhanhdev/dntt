const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

// 🟢 Lấy hồ sơ người dùng (frontend)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("❌ getProfile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Cập nhật hồ sơ người dùng (frontend)
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updatable = [
      "name", "phone", "address", "bio",
      "company", "jobTitle", "website",
      "facebook", "linkedin", "gender"
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    if (req.body.skills) {
      user.skills = req.body.skills.split(",").map((s) => s.trim());
    }

    if (req.files?.avatar?.length > 0) {
      const result = await cloudinary.uploader.upload(req.files.avatar[0].path, {
        folder: "users/avatars",
      });
      user.avatar = result.secure_url;
      fs.unlinkSync(req.files.avatar[0].path);
    }

    if (req.files?.cover?.length > 0) {
      const result = await cloudinary.uploader.upload(req.files.cover[0].path, {
        folder: "users/covers",
      });
      user.cover = result.secure_url;
      fs.unlinkSync(req.files.cover[0].path);
    }

    await user.save();

    res.json({
      message: "🎉 Hồ sơ đã được cập nhật!",
      user,
    });
  } catch (error) {
    console.error("❌ updateProfile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
