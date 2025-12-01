// src/api/adminUserApi.js
import axios from "axios";
import { ADMIN_API_URL } from "./config"; 
// ADMIN_API_URL = `${API_BASE}/api/admin`

// 👉 Tạo instance API cho admin/users
const API = axios.create({
  baseURL: `${ADMIN_API_URL}/users`,
});

// 👉 Gắn token tự động
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

/* =========================================================
   USERS CRUD
========================================================= */

// 🔹 Lấy danh sách user
export const getUsers = () => API.get("/");

// 🔹 Xóa user
export const deleteUser = (id) => API.delete(`/${id}`);

// 🔹 Cập nhật role user
export const updateUserRole = (id, role) =>
  API.put(`/${id}/role`, { role });

// 🔹 Tạo user mới (formData)
export const createUser = (data) =>
  API.post("/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// 🔹 Cập nhật user (name, email, avatar, role)
export const updateUser = (id, data) =>
  API.put(`/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// 🔹 Đổi mật khẩu user
export const updateUserPassword = (id, newPassword) =>
  API.put(`/${id}/password`, { password: newPassword });
