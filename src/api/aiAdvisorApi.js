// src/api/aiAdvisorApi.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const aiAdvisorClient = axios.create({
  baseURL: `${API_BASE}/ai`,
});

aiAdvisorClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const aiAdvisorApi = {
  // Entry test → Skill Map AI
  generateSkillMapFromEntryTest: async (payload) => {
    const res = await aiAdvisorClient.post(
      "/skill-map-from-entry-test",
      payload
    );
    return res.data; // { ok, input, ai: { skillLevels, recommendedPath, suggestedSkills } }
  },

  // Exam thường → gợi ý ôn tập & cập nhật profile
  analyzeLearningPathAfterExam: async (payload) => {
    const res = await aiAdvisorClient.post(
      "/learning-path-after-exam",
      payload
    );
    return res.data; // { ok, input, ai: { weakSkills, shouldReview, recommendations } }
  },

  // Lấy profile kỹ năng hiện tại của 1 user trong 1 course
  getUserSkillProfile: async ({ courseId, userId }) => {
    const res = await aiAdvisorClient.get("/user-skill-profile", {
      params: { course: courseId, user: userId },
    });
    return res.data; // { ok, profiles: [...] }
  },
};

export default aiAdvisorApi;
