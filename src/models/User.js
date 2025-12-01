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
    avatar: { type: String },
    phone: { type: String },
    address: { type: String },
    bio: { type: String },
    company: { type: String },
    jobTitle: { type: String },
    skills: { type: [String], default: [] },
    website: { type: String },
    facebook: { type: String },
    linkedin: { type: String },
    gender: { type: String, enum: ["male","female","other"], default: "other"},
    birthdate: { type: Date },
    birthday: { type: Date },
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
