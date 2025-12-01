// src/api/courseApi.js
import axios from "axios";
import { API_URL } from "./config";
// API_URL = `${API_BASE}/api`
// → Local:  http://localhost:5000/api
// → Render: https://hkcode.onrender.com/api

const client = axios.create({
  baseURL: API_URL,
});

// Gắn token tự động
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* =========================================================
   🔹 Lấy danh sách khoá học (admin)
   /api/admin/courses
========================================================= */
const getAll = async (params = {}) => {
  const res = await client.get("/admin/courses", { params });
  return res.data;
};

/* =========================================================
   🔹 Dropdown khoá học
   /api/admin/courses/dropdowns
========================================================= */
const getDropdowns = async () => {
  const res = await client.get("/admin/courses/dropdowns");
  return res.data;
};

/* =========================================================
   🔹 Chi tiết khoá học
   /api/admin/courses/:id
========================================================= */
const getDetail = async (id) => {
  const res = await client.get(`/admin/courses/${id}`);
  return res.data;
};

const courseApi = {
  getAll,
  getDropdowns,
  getDetail,

  // alias admin cho tiện dùng
  admin: {
    getAll,
    getDropdowns,
    getDetail,
  },
};

export default courseApi;
