// src/api/questionApi.js
import axios from "axios";
import { API_URL } from "./config";
// API_URL = `${API_BASE}/api`
// Local  → http://localhost:5000/api
// Render → https://hkcode.onrender.com/api

const client = axios.create({
  baseURL: API_URL,
});

// Gắn token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===============================
// CRUD CÂU HỎI (admin)
// ===============================

const getQuestions = async (params = {}) => {
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

// Export
const questionApi = {
  getQuestions,
  getQuestionDetail,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  admin: {
    getQuestions,
    getQuestionDetail,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  },
};

export default questionApi;
