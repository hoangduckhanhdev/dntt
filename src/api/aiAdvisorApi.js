// src/api/aiAdvisorApi.js
import axios from "axios";
import { API_BASE } from "./config"; 
// API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"

// 👉 AI Advisor dùng /api/ai
const aiAdvisorClient = axios.create({
  baseURL: `${API_BASE}/api/ai`,
});

// 👉 Tự động gắn token
aiAdvisorClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const aiAdvisorApi = {
  // ⭐ Entry Test → tạo Skill Map (AI)
  generateSkillMapFromEntryTest: async (payload) => {
    const res = await aiAdvisorClient.post(
      "/skill-map-from-entry-test",
      payload
    );
    return res.data;
  },

  // ⭐ Exam → phân tích năng lực, gợi ý lộ trình (AI)
  analyzeLearningPathAfterExam: async (payload) => {
    const res = await aiAdvisorClient.post(
      "/learning-path-after-exam",
      payload
    );
    return res.data;
  },

  // ⭐ Lấy Skill Profile của user
  getUserSkillProfile: async ({ courseId, userId }) => {
    const res = await aiAdvisorClient.get("/user-skill-profile", {
      params: { course: courseId, user: userId },
    });
    return res.data;
  },
};

export default aiAdvisorApi;
