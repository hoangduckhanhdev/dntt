// src/api/examQuestionApi.js
import axios from "axios";
import { API_URL } from "./config";
// API_URL = `${API_BASE}/api`
// → Local:  http://localhost:5000/api
// → Render: https://hkcode.onrender.com/api

const client = axios.create({
  baseURL: API_URL,
});

// Gắn token JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const examQuestionApi = {
  admin: {
    // Danh sách câu hỏi (có filter)
    getQuestions: async (params = {}) => {
      const res = await client.get("/admin/exam-questions", { params });

      const data = res.data;

      // hỗ trợ nhiều kiểu response từ backend
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.items)
        ? data.items
        : [];

      return {
        raw: data,
        items,
      };
    },

    // Lấy filters cho 1 khoá
    getFilters: async (courseId) => {
      const res = await client.get("/admin/exam-questions/filters", {
        params: { course: courseId },
      });
      return res.data || {};
    },

    // Tạo câu hỏi
    createQuestion: async (payload) => {
      const res = await client.post("/admin/exam-questions", payload);
      return res.data;
    },

    // Cập nhật
    updateQuestion: async (id, payload) => {
      const res = await client.put(`/admin/exam-questions/${id}`, payload);
      return res.data;
    },

    // Xoá
    deleteQuestion: async (id) => {
      const res = await client.delete(`/admin/exam-questions/${id}`);
      return res.data;
    },
  },
};

export default examQuestionApi;
