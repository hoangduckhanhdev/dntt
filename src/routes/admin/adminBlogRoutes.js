const express = require("express");
const router = express.Router();
const upload = require("../../middlewares/upload");
const { protect, adminOrTeacher } = require("../../middlewares/authMiddleware");
const {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  searchBlogs,
} = require("../../controllers/admin/adminBlogController");

// 🔍 Tìm kiếm blog (phải đặt trước /:id)
router.get("/search", protect, adminOrTeacher, searchBlogs);

// 📄 Lấy tất cả blog
router.get("/", protect, adminOrTeacher, getAllBlogs);

// ➕ Tạo blog mới (có upload thumbnail)
router.post(
  "/",
  protect,
  adminOrTeacher,
  upload.single("thumbnail"),
  createBlog
);

// ✏️ Cập nhật blog (có thể đổi thumbnail)
router.put(
  "/:id",
  protect,
  adminOrTeacher,
  upload.single("thumbnail"),
  updateBlog
);

// ❌ Xóa blog
router.delete("/:id", protect, adminOrTeacher, deleteBlog);

module.exports = router;
