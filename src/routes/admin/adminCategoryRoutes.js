// adminCategoryRoutes.js
const express = require("express");
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../../controllers/admin/adminCategoryController");

// CRUD cho danh mục
router.get("/", getCategories);       // GET /api/admin/categories
router.post("/", createCategory);     // POST /api/admin/categories
router.put("/:id", updateCategory);   // PUT /api/admin/categories/:id
router.delete("/:id", deleteCategory);// DELETE /api/admin/categories/:id

module.exports = router;
