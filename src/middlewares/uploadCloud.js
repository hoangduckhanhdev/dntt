const multer = require("multer");

// Dùng memoryStorage để không ghi file vào disk, chỉ giữ trong RAM
const storage = multer.memoryStorage();

const uploadCloud = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const isValid = allowed.test(file.mimetype);
    if (isValid) cb(null, true);
    else cb(new Error("Chỉ được upload file ảnh (.jpeg, .jpg, .png, .webp)"));
  },
});

module.exports = uploadCloud;
