// src/api/classApi.js
import axios from "axios";
import { API_URL } from "./config"; 
// API_URL = `${API_BASE}/api`
// → Local:  http://localhost:5000/api
// → Render: https://hkcode.onrender.com/api

const client = axios.create({
  baseURL: API_URL, 
});

// Gắn token tự động cho mọi request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ========================================================
   🔹 GET LIST CLASS
   /api/admin/course-classes
   ======================================================== */
const getAll = async (params = {}) => {
  const res = await client.get("/admin/course-classes", { params });
  return res.data;
};

/* ========================================================
   🔹 GET DROPDOWNS
   /api/admin/course-classes/dropdowns
   ======================================================== */
const getDropdowns = async (params = {}) => {
  const res = await client.get("/admin/course-classes/dropdowns", { params });
  return res.data;
};

/* ========================================================
   🔹 GET DETAIL CLASS
   /api/admin/course-classes/:id
   ======================================================== */
const getDetail = async (id) => {
  const res = await client.get(`/admin/course-classes/${id}`);
  return res.data;
};

const classApi = {
  getAll,
  getDropdowns,
  getDetail,

  // Alias
  admin: {
    getAll,
    getDropdowns,
    getDetail,
  },
};

export default classApi;
