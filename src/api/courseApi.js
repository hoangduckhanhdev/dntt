// src/api/courseApi.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const client = axios.create({
  baseURL: API_BASE,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lấy danh sách khoá học (cho dropdown)
const getAll = async (params = {}) => {
  const res = await client.get("/admin/courses", { params });
  return res.data;
};

// Lấy dropdown (tuỳ backend bạn trả – có thể gồm course, chapters, tags...)
const getDropdowns = async () => {
  const res = await client.get("/admin/courses/dropdowns");
  return res.data;
};

const getDetail = async (id) => {
  const res = await client.get(`/admin/courses/${id}`);
  return res.data;
};

const courseApi = {
  // dùng thẳng: courseApi.getAll(), courseApi.getDropdowns()
  getAll,
  getDropdowns,
  getDetail,

  // alias admin
  admin: {
    getAll,
    getDropdowns,
    getDetail,
  },
};

export default courseApi;
