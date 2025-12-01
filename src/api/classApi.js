// src/api/classApi.js
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

// Lấy danh sách lớp (có thể lọc theo course)
const getAll = async (params = {}) => {
  // ví dụ params: { course: "courseId" }
  const res = await client.get("/admin/course-classes", { params });
  return res.data;
};

// Dropdown lớp
const getDropdowns = async (params = {}) => {
  const res = await client.get("/admin/course-classes/dropdowns", { params });
  return res.data;
};

const getDetail = async (id) => {
  const res = await client.get(`/admin/course-classes/${id}`);
  return res.data;
};

const classApi = {
  // dùng thẳng: classApi.getAll({ course: ... })
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

export default classApi;
