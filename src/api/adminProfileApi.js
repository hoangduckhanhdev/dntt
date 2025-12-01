// src/api/adminProfileApi.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

// 🧭 Tự động gắn token Authorization nếu có
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
    const res = await API.get("/api/admin/profile");
    return res.data;
  },

  // 💾 Cập nhật hồ sơ
  updateProfile: async (data) => {
    const res = await API.put("/api/admin/profile", data);
    return res.data;
  },
};

export default adminProfileApi;
