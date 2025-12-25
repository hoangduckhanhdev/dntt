import axios from "axios";
import { API_URL } from "./config";

const client = axios.create({
  baseURL: API_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const examQuestionApi = {
  admin: {
    getQuestions: async (params = {}) => {
      if (!params?.course) {
        return { raw: { items: [] }, items: [] };
      }

      try {
        const res = await client.get("/admin/exam-questions", { params });
        const data = res.data || {};
        const items = Array.isArray(data.items) ? data.items : [];
        return { raw: data, items };
      } catch (err) {
        console.log(
          "GET /admin/exam-questions error:",
          err?.response?.status,
          err?.response?.data
        );
        throw err;
      }
    },

    getFilters: async (courseId, chapter) => {
      if (!courseId) return { chapters: [], tags: [] };

      const params = { course: courseId };
      if (chapter) params.chapter = chapter;

      const res = await client.get("/admin/exam-questions/filters", { params });
      return res.data || { chapters: [], tags: [] };
    },

    createQuestion: async (payload) => {
      const res = await client.post("/admin/exam-questions", payload);
      return res.data;
    },

    updateQuestion: async (id, payload) => {
      const res = await client.put(`/admin/exam-questions/${id}`, payload);
      return res.data;
    },

    deleteQuestion: async (id) => {
      const res = await client.delete(`/admin/exam-questions/${id}`);
      return res.data;
    },
  },
};

export default examQuestionApi;
