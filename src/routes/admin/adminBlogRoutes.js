const express = require("express");
const router = express.Router();

// DÙNG CloudinaryStorage
const upload = require("../../middlewares/upload");

const { protect, adminOrTeacher } = require("../../middlewares/authMiddleware");
const {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  searchBlogs,
} = require("../../controllers/admin/adminBlogController");

// Tìm kiếm
router.get("/search", protect, adminOrTeacher, searchBlogs);

// Lấy tất cả blog
router.get("/", protect, adminOrTeacher, getAllBlogs);

// Tạo blog (CLOUDINARY UPLOAD)
router.post(
  "/",
  protect,
  adminOrTeacher,
  upload.single("thumbnail"),
  createBlog
);

// Cập nhật blog (CLOUDINARY UPLOAD)
router.put(
  "/:id",
  protect,
  adminOrTeacher,
  upload.single("thumbnail"),
  updateBlog
);

// Xóa blog
router.delete("/:id", protect, adminOrTeacher, deleteBlog);

module.exports = router;
