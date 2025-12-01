// src/api/adminBlogApi.js
import axios from "axios";
import { ADMIN_API_URL } from "./config";

const getToken = () => localStorage.getItem("token");

// Tạo instance axios dùng chung
const api = axios.create({
  baseURL: `${ADMIN_API_URL}/blogs`, // ví dụ: https://hkcode.onrender.com/api/admin/blogs
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động inject token trước mỗi request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ============================
    GET ALL BLOGS
============================ */
export const getAllBlogs = async () => {
  try {
    const res = await api.get("/");
    return res.data;
  } catch (err) {
    console.error("Error getAllBlogs:", err.response || err);
    throw err;
  }
};

/* ============================
      CREATE BLOG
============================ */
export const createBlog = async (blogData) => {
  try {
    const formData = new FormData();

    formData.append("title", blogData.get("title") || "");
    formData.append("content", blogData.get("content") || "");

    if (blogData.get("category"))
      formData.append("category", blogData.get("category"));

    if (blogData.get("tags"))
      formData.append("tags", blogData.get("tags"));

    if (blogData.get("thumbnail"))
      formData.append("thumbnail", blogData.get("thumbnail"));

    const res = await api.post("/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (err) {
    console.error("Error createBlog:", err.response?.data || err);
    throw err;
  }
};

/* ============================
       UPDATE BLOG
============================ */
export const updateBlog = async (id, formData) => {
  try {
    const res = await api.put(`/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error updateBlog:", err.response?.data || err);
    throw err;
  }
};

/* ============================
       DELETE BLOG
============================ */
export const deleteBlog = async (id) => {
  try {
    const res = await api.delete(`/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error deleteBlog:", err.response || err);
    throw err;
  }
};

/* ============================
       SEARCH BLOG
============================ */
export const searchBlogs = async (query) => {
  try {
    const res = await api.get(`/search?query=${encodeURIComponent(query)}`);
    return res.data;
  } catch (err) {
    console.error("Error searchBlogs:", err.response || err);
    throw err;
  }
};
