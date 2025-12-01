// src/api/adminSearchApi.js
import axios from "axios";
import { ADMIN_API_URL } from "./config";

// 👉 Base URL ví dụ:
// https://hkcode.onrender.com/api/admin/search
const API = axios.create({
  baseURL: `${ADMIN_API_URL}/search`,
});

// 🔐 Gắn token tự động
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 🔥 API Search Admin (tìm kiếm toàn hệ thống)
const adminSearchApi = {
  search: async (keyword) => {
    const res = await API.get(`?q=${encodeURIComponent(keyword)}`);
    return res.data;
  },
};

export default adminSearchApi;
