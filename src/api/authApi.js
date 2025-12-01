// src/api/authApi.js
import axios from "axios";
import { API_URL } from "./config"; 
// API_URL = `${API_BASE}/api`

// Tạo instance auth dùng chung
const api = axios.create({
  baseURL: API_URL,      // ví dụ: https://hkcode.onrender.com/api
  withCredentials: true, // nếu backend dùng cookie, cứ giữ
});

// Gắn token (nếu có) vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Chuẩn hoá lỗi trả về
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const normalized = {
      status: err.response?.status || 0,
      data: err.response?.data || null,
      message:
        err.response?.data?.message ||
        err.message ||
        "Request failed",
      url: err.config?.url,
      method: err.config?.method,
    };
    return Promise.reject(normalized);
  }
);

// Auth APIs
export const loginUser = (data) => api.post("/auth/login", data);
export const registerUser = (data) => api.post("/auth/register", data);

export default api;
