// src/routes/admin/examQuestionAdminRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");

const { protect, adminOrTeacher } = require("../../middlewares/authMiddleware");
const qCtrl = require("../../controllers/admin/adminExamQuestionController");

// dùng memoryStorage vì file chỉ để đọc rồi insert DB, không cần lưu đĩa
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// tất cả đều phải login + admin/teacher
router.use(protect, adminOrTeacher);

// ===== IMPORT =====
router.post("/import", upload.single("file"), qCtrl.importQuestions);

// Lấy danh sách filter phải đứng trước "/" để tránh bị nuốt path
router.get("/filters", qCtrl.getQuestionFilters);

// Lấy danh sách câu hỏi + filter
router.get("/", qCtrl.getQuestions);

// CRUD câu hỏi
router.post("/", qCtrl.createQuestion);
router.put("/:id", qCtrl.updateQuestion);
router.delete("/:id", qCtrl.deleteQuestion);

module.exports = router;
