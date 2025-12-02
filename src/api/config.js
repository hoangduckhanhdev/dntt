// src/api/config.js

const isBrowser = typeof window !== "undefined";

const FALLBACK_API_BASE =
  isBrowser && window.location.hostname !== "localhost"
    ? "https://hkcode.onrender.com"
    : "http://localhost:5000";

export const API_BASE = import.meta.env.VITE_API_URL || FALLBACK_API_BASE;

// https://hkcode.onrender.com/api hoặc http://localhost:5000/api
export const API_URL = `${API_BASE}/api`;
export const ADMIN_API_URL = `${API_BASE}/api/admin`;

// Cho các file cũ nếu có dùng
export const API_BASE_URL = API_URL;
