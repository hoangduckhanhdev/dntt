// routes/payment.js
const express = require("express");
const router = express.Router();

const requireAuth = require("../middlewares/requireAuth");
const {
  registerCourse,
  handlePayOSWebhook,
  checkPaymentStatus,
  confirmReturn,
  createMultiPayment, // PHẢI có dòng này
} = require("../controllers/payosController");

// 1 khóa
router.post("/create", requireAuth, registerCourse);

// nhiều khóa
router.post("/create-multi", requireAuth, createMultiPayment);

router.post("/webhook", handlePayOSWebhook);
router.get("/check-status", checkPaymentStatus);
router.get("/confirm-return", confirmReturn);

module.exports = router;
