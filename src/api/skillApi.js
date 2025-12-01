// src/api/skillApi.js
import axios from "axios";
import { API_URL } from "./config";
// API_URL = `${API_BASE}/api`
// → Local:  http://localhost:5000/api
// → Render: https://hkcode.onrender.com/api

const skillClient = axios.create({
  baseURL: API_URL,
});

skillClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const skillApi = {
  // Lấy toàn bộ skill của 1 course
  getSkillsByCourse: async (courseId) => {
    const res = await skillClient.get("/skills", {
      params: { course: courseId },
    });

    return res.data;
  },
};

export default skillApi;
