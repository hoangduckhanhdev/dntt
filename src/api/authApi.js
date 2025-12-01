// src/api/authApi.js
import axios from "axios";

// Chuẩn hoá baseURL: nếu VITE_API_URL chưa có /api thì tự thêm
const RAW = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BASE = RAW.endsWith("/api") ? RAW : `${RAW}/api`;

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const normalized = {
      status: err.response?.status || 0,
      data: err.response?.data || null,
      message: err.response?.data?.message || err.message || "Request failed",
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
