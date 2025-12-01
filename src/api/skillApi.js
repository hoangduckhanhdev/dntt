// src/api/skillApi.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const skillClient = axios.create({
  baseURL: API_BASE,
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
    return res.data; // mong đợi: [{ _id, name, description, parentSkill, level, order }]
  },
};

export default skillApi;
