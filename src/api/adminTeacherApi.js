// src/api/adminTeacherApi.js
import axios from "axios";
import { ADMIN_API_URL } from "./config"; 
// ADMIN_API_URL = `${API_BASE}/api/admin`
// API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"

// 👉 baseURL chuẩn cho backend admin
const API = axios.create({
  baseURL: `${ADMIN_API_URL}/teachers`, 
  headers: { Accept: "application/json" },
});

// 👉 Tự gắn token cho mọi request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ============================================================
   TEACHER CRUD
============================================================ */

// 🔹 Lấy danh sách giáo viên
export const getAllTeachers = () => API.get("/");

// 🔹 Tạo giáo viên mới (FormData)
export const createTeacher = (data) =>
  API.post("/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// 🔹 Cập nhật giáo viên
export const updateTeacher = (id, data) =>
  API.put(`/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// 🔹 Xóa giáo viên
export const deleteTeacher = (id) => API.delete(`/${id}`);
