// src/middlewares/upload.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// ⚙️ Cấu hình upload ảnh trực tiếp lên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "courses", // 📂 Ảnh lưu trong thư mục 'courses' trên Cloudinary
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ quality: "auto", fetch_format: "auto" }], // tự nén & tối ưu ảnh
    };
  },
});

// 🚀 Khởi tạo multer
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // giới hạn 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("❌ Định dạng file không hợp lệ (chỉ chấp nhận jpg, png, webp)"));
  },
});

module.exports = upload;
