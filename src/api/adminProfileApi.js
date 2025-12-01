// src/api/adminProfileApi.js
import axios from "axios";
import { ADMIN_API_URL } from "./config";

// 👉 Base URL ví dụ:
// https://hkcode.onrender.com/api/admin/profile
const API = axios.create({
  baseURL: ADMIN_API_URL,
});

// 🧭 Tự động gắn token Authorization nếu có
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Bắt lỗi chung
API.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API Error:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);

const adminProfileApi = {
  // 📄 Lấy hồ sơ
  getProfile: async () => {
    const res = await API.get("/profile");
    return res.data;
  },

  // 💾 Cập nhật hồ sơ
  updateProfile: async (data) => {
    const res = await API.put("/profile", data);
    return res.data;
  },
};

export default adminProfileApi;
