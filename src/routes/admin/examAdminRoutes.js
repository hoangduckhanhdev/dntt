// src/routes/admin/examAdminRoutes.js
const express = require("express");
const router = express.Router();

const { protect, adminOrTeacher } = require("../../middlewares/authMiddleware");
const examAdminCtrl = require("../../controllers/admin/adminExamController");

// 🔒 Tất cả route dưới đây yêu cầu login + admin/teacher
router.use(protect, adminOrTeacher);

/* ======================= CRUD EXAM ======================= */

// Tạo đề thi
// POST /api/admin/exams
router.post("/", examAdminCtrl.createExam);

// Danh sách đề thi (?course=courseId là optional)
// GET /api/admin/exams
router.get("/", examAdminCtrl.getExams);

// Chi tiết 1 đề thi
// GET /api/admin/exams/:id
router.get("/:id", examAdminCtrl.getExam);

// Cập nhật đề thi (Frontend đang dùng PATCH → nhưng vẫn support PUT)
// PUT /api/admin/exams/:id
router.put("/:id", examAdminCtrl.updateExam);

// PATCH /api/admin/exams/:id
router.patch("/:id", examAdminCtrl.updateExam);

// Xoá đề thi
// DELETE /api/admin/exams/:id
router.delete("/:id", examAdminCtrl.deleteExam);

/* ======================= PUBLISH ========================= */

// Publish / unpublish đề thi
// Frontend đang dùng PATCH /api/admin/exams/:id/publish
router.put("/:id/publish", examAdminCtrl.publishExam);
router.patch("/:id/publish", examAdminCtrl.publishExam);

/* ======================= ATTEMPTS ========================= */

// Danh sách bài làm của học viên trong 1 đề
// GET /api/admin/exams/:id/attempts
router.get("/:id/attempts", examAdminCtrl.getExamAttempts);

// Chi tiết bài làm
// GET /api/admin/exams/:id/attempts/:attemptId
router.get("/:id/attempts/:attemptId", examAdminCtrl.getAttemptDetail);

// Chấm điểm bài làm
// FE hiện đang dùng POST /api/admin/exams/:id/attempts/:attemptId/grade
// Nhưng ta vẫn mở thêm PUT cho linh hoạt
router.put("/:id/attempts/:attemptId/grade", examAdminCtrl.gradeAttempt);
router.post("/:id/attempts/:attemptId/grade", examAdminCtrl.gradeAttempt);

module.exports = router;
