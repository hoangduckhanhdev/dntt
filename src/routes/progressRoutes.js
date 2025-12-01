const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const progressController = require("../controllers/progressController");

// lấy tiến độ 1 khoá
router.get("/:courseId", protect, progressController.getProgressForCourse);

// cập nhật tiến độ 1 khoá
router.post("/:courseId", protect, progressController.updateProgressForCourse);

module.exports = router;
