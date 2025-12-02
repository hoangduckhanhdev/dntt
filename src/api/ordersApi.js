// src/api/ordersApi.js
import api from "./authApi";

/* ======================================================
   🛒 ORDER API — dùng instance chung (token, cookies, lỗi)
   ===================================================== */

// 🆕 Tạo đơn hàng mới
export const createOrder = async (orderData) => {
  const res = await api.post("/orders", orderData);
  return res.data;
};

// 📦 Lấy tất cả đơn hàng (admin)
export const getAllOrders = async () => {
  const res = await api.get("/orders");
  return res.data;
};

// 📄 Lấy đơn hàng của 1 user
export const getUserOrders = async (userId) => {
  const res = await api.get(`/orders/user/${userId}`);
  return res.data;
};

// 🔍 Lấy chi tiết một đơn hàng
export const getOrderById = async (id) => {
  const res = await api.get(`/orders/${id}`);
  return res.data;
};

// ✏️ Cập nhật trạng thái đơn hàng (admin)
export const updateOrderStatus = async (id, status) => {
  const res = await api.put(`/orders/${id}/status`, { status });
  return res.data;
};

// 🗑️ Xóa đơn hàng (admin)
export const deleteOrder = async (id) => {
  const res = await api.delete(`/orders/${id}`);
  return res.data;
};

/* ======================================================
   💳 PAYMENTS API — xử lý thanh toán
   ===================================================== */

// Tạo payment (endpoint bạn đang gọi)
export const createPayment = async (payload) => {
  const res = await api.post("/payments/create", payload);
  return res.data;
};

// Tạo payment nhiều item
export const createPaymentMulti = async (payload) => {
  // payload: { items: [{courseId, title, price, qty}] }
  const res = await api.post("/payments/create-multi", payload);
  return res.data;
};

export default {
  createOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  createPayment,
  createPaymentMulti,
};
