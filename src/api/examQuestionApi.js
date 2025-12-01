// src/api/examQuestionApi.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const client = axios.create({
  baseURL: API_BASE,
});

// Gắn token
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
      // linh hoạt: BE có thể trả {data}, {items} hoặc mảng trực tiếp
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

    // Lấy filters (chương, tags) cho 1 khoá
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

    // Sửa câu hỏi
    updateQuestion: async (id, payload) => {
      const res = await client.put(`/admin/exam-questions/${id}`, payload);
      return res.data;
    },

    // Xoá câu hỏi
    deleteQuestion: async (id) => {
      const res = await client.delete(`/admin/exam-questions/${id}`);
      return res.data;
    },
  },
};

export default examQuestionApi;
