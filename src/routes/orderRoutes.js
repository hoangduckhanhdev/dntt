// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

/* ============= CLIENT ============= */
// Tạo đơn hàng khi bấm "Thanh toán"
router.post("/", orderController.createOrder);

// Lấy đơn hàng của 1 user (trang Lịch sử mua)
router.get("/user/:userId", orderController.getMyOrders);

/* ============= ADMIN ============= */
// Lấy tất cả đơn hàng (admin xem thống kê)
router.get("/", orderController.getAllOrders);

// Cập nhật trạng thái đơn: pending -> paid / cancelled / failed / refunded
router.patch("/:id/status", orderController.updateOrderStatus);

module.exports = router;
