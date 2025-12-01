// src/api/config.js
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API_URL = `${API_BASE}/api`;
export const ADMIN_API_URL = `${API_BASE}/api/admin`;
