// src/api/adminUserApi.js
import api from "./authApi"; 
// api đã có baseURL = API_URL + interceptor token

const ADMIN_USER_BASE = "/admin/users";

/* ================================
   🔹 Lấy danh sách user
================================ */
export const getUsers = () => api.get(ADMIN_USER_BASE);

/* ================================
   🔹 Tạo user mới
================================ */
export const createUser = (formData) =>
  api.post(ADMIN_USER_BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/* ================================
   🔹 Cập nhật user
================================ */
export const updateUser = (id, formData) =>
  api.put(`${ADMIN_USER_BASE}/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/* ================================
   🔹 Cập nhật role
================================ */
export const updateUserRole = (id, role) =>
  api.patch(`${ADMIN_USER_BASE}/${id}/role`, { role });

/* ================================
   🔹 Đổi mật khẩu user
================================ */
export const updateUserPassword = (id, newPassword) =>
  api.patch(`${ADMIN_USER_BASE}/${id}/password`, {
    password: newPassword,
  });

/* ================================
   🔹 Xóa user
================================ */
export const deleteUser = (id) => api.delete(`${ADMIN_USER_BASE}/${id}`);

export default {
  getUsers,
  createUser,
  updateUser,
  updateUserRole,
  updateUserPassword,
  deleteUser,
};
