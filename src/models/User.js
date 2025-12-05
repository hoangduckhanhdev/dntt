// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    password: {
      type: String,
      required: function () {
        // ❗ Bắt buộc nếu không đăng nhập bằng Google
        return !this.googleId;
      },
    },

    googleId: { type: String },

    // Ảnh
    avatar: { type: String, default: "" },
    cover: { type: String, default: "" },

    // Thông tin cá nhân
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    bio: { type: String, default: "" },
    company: { type: String, default: "" },
    jobTitle: { type: String, default: "" },

    // Kỹ năng
    skills: { type: [String], default: [] },

    // Website & MXH
    website: { type: String, default: "" },
    facebook: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    zalo: { type: String, default: "" },
    github: { type: String, default: "" },

    // Học tập & sở thích
    goal: { type: String, default: "" },           // Mục tiêu học tập
    interests: { type: String, default: "" },      // Sở thích
    learningStyle: { type: String, default: "" },  // Phong cách học

    // Ngày sinh (dùng birthday cho ProfilePage)
    birthday: { type: Date },
    birthdate: { type: Date }, // nếu chỗ khác đang dùng, giữ lại

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },

    // Thống kê đơn giản
    totalCourses: { type: Number, default: 0 },

    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// ✅ Mã hóa mật khẩu trước khi lưu
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Kiểm tra mật khẩu
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Google user không có password
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
