// src/api/questionApi.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const client = axios.create({
  baseURL: API_BASE,
});

// gắn token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Các hàm chính để dùng trong form tạo đề thi
const getQuestions = async (params = {}) => {
  // ví dụ params: { course, chapter, tag, difficulty }
  const res = await client.get("/admin/exam-questions", { params });
  return res.data;
};

const getQuestionDetail = async (id) => {
  const res = await client.get(`/admin/exam-questions/${id}`);
  return res.data;
};

const createQuestion = async (payload) => {
  const res = await client.post("/admin/exam-questions", payload);
  return res.data;
};

const updateQuestion = async (id, payload) => {
  const res = await client.put(`/admin/exam-questions/${id}`, payload);
  return res.data;
};

const deleteQuestion = async (id) => {
  const res = await client.delete(`/admin/exam-questions/${id}`);
  return res.data;
};

const questionApi = {
  // dùng thẳng: questionApi.getQuestions(...)
  getQuestions,
  getQuestionDetail,
  createQuestion,
  updateQuestion,
  deleteQuestion,

  // alias admin cho dễ mở rộng
  admin: {
    getQuestions,
    getQuestionDetail,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  },
};

export default questionApi;
