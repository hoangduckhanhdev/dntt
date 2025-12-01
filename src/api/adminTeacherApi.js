// src/api/adminTeacherApi.js
import axios from "axios";

// ✅ Dùng base URL chung cho admin
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/admin",
  headers: {
    Accept: "application/json",
  },
});

// ✅ Tự gắn token cho tất cả request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Lấy tất cả giáo viên
export const getAllTeachers = () => API.get("/teachers");

// ✅ Tạo giáo viên (FormData)
export const createTeacher = (data) =>
  API.post("/teachers", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ✅ Cập nhật giáo viên (FormData)
export const updateTeacher = (id, data) =>
  API.put(`/teachers/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ✅ Xóa giáo viên
export const deleteTeacher = (id) => API.delete(`/teachers/${id}`);
