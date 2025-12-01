const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getTeacherDashboard, // 👈 thêm
} = require("../../controllers/admin/dashboardController");
const { protect, admin, adminOrTeacher } = require("../../middlewares/authMiddleware");

router.get("/", protect, admin, getDashboardStats);

router.get("/teacher", protect, adminOrTeacher, getTeacherDashboard);

module.exports = router;
