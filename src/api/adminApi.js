// src/api/adminApi.js
import axios from "axios";
import { API_URL } from "./config";

// Tạo instance axios dùng chung cho admin
const base = axios.create({
  baseURL: API_URL, // ví dụ: http://localhost:5000/api hoặc https://hkcode.onrender.com/api
});

// Hàm set token cho tất cả request admin
const setToken = (token) => {
  base.defaults.headers.common["Authorization"] = token
    ? `Bearer ${token}`
    : "";
};

// Lấy tổng số user / course / blog cho dashboard admin
export const getCounts = async () => {
  const result = { users: 0, courses: 0, blogs: 0 };

  try {
    const [u, c, b] = await Promise.allSettled([
      base.get("/users"),
      base.get("/courses"),
      base.get("/blogs"),
    ]);

    if (u.status === "fulfilled" && Array.isArray(u.value.data)) {
      result.users = u.value.data.length;
    }
    if (c.status === "fulfilled" && Array.isArray(c.value.data)) {
      result.courses = c.value.data.length;
    }
    if (b.status === "fulfilled" && Array.isArray(b.value.data)) {
      result.blogs = b.value.data.length;
    }
  } catch (e) {
    console.warn("adminApi.getCounts partial fail", e);
  }

  return result;
};

export default { setToken, getCounts };
