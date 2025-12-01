// src/api/adminApi.js
import axios from "axios";

const base = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000/api",
});

const setToken = (token) => {
  base.defaults.headers.common["Authorization"] = token ? `Bearer ${token}` : "";
};

export const getCounts = async () => {
  const result = { users: 0, courses: 0, blogs: 0 };
  try {
    const [u, c, b] = await Promise.allSettled([
      base.get("/users"),
      base.get("/courses"),
      base.get("/blogs"),
    ]);
    if (u.status === "fulfilled" && Array.isArray(u.value.data)) result.users = u.value.data.length;
    if (c.status === "fulfilled" && Array.isArray(c.value.data)) result.courses = c.value.data.length;
    if (b.status === "fulfilled" && Array.isArray(b.value.data)) result.blogs = b.value.data.length;
  } catch (e) {
    console.warn("adminApi.getCounts partial fail", e);
  }
  return result;
};

export default { setToken, getCounts };
