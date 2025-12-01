// src/config/cloudinary.js
const cloudinary = require("cloudinary").v2;
require("dotenv").config(); // chỉ cần dòng này, không cần import dotenv riêng

// Kiểm tra biến môi trường
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("❌ Thiếu cấu hình Cloudinary trong file .env!");
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // 👈 thêm để đảm bảo link https
  });

  console.log("✅ Cloudinary connected:", process.env.CLOUDINARY_CLOUD_NAME);
}

module.exports = cloudinary;
