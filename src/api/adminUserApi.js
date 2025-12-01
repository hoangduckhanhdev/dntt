import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/admin",
});

// ✅ Gắn token tự động
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ==================== USERS CRUD ====================
export const getUsers = () => API.get("/users");
export const deleteUser = (id) => API.delete(`/users/${id}`);

export const updateUserRole = (id, role) =>
  API.put(`/users/${id}/role`, { role });

export const createUser = (data) =>
  API.post("/users", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// 🟡 Cập nhật user (name, email, role, avatar)
export const updateUser = (id, data) =>
  API.put(`/users/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ==================== 🔑 ĐỔI MẬT KHẨU USER ====================
export const updateUserPassword = (id, newPassword) =>
  API.put(`/users/${id}/password`, { password: newPassword });
