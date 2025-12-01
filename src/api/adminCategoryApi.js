// src/api/adminCategoryApi.js
import axios from "axios";
import { ADMIN_API_URL } from "./config";
// ADMIN_API_URL = `${API_BASE}/api/admin`

const api = axios.create({
  baseURL: `${ADMIN_API_URL}/categories`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ luôn trả về { categories: [...] }
export const getAllCategories = async () => {
  const res = await api.get("/");
  const payload = res.data;

  const categories = Array.isArray(payload)
    ? payload
    : payload.categories || payload.data || [];

  return { categories };
};

export const createCategory = async (data) => {
  const res = await api.post("/", data);
  return res.data;
};

export const updateCategory = async (id, data) => {
  const res = await api.put(`/${id}`, data);
  return res.data;
};

export const deleteCategory = async (id) => {
  const res = await api.delete(`/${id}`);
  return res.data;
};

export default {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
