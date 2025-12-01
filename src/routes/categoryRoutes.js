const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// Các route chính
router.get("/", getCategories);          // Lấy tất cả danh mục
router.get("/:idOrSlug", getCategoryByIdOrSlug);    // Lấy chi tiết danh mục
router.post("/", createCategory);        // Tạo danh mục mới
router.put("/:id", updateCategory);      // Cập nhật danh mục
router.delete("/:id", deleteCategory);   // Xóa danh mục

module.exports = router;
