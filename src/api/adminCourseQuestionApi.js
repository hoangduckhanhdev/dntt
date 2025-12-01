// src/api/adminCourseQuestionApi.js
import axios from "axios";
import { ADMIN_API_URL } from "./config";

// Tạo instance API admin
const API = axios.create({
  baseURL: ADMIN_API_URL, // ví dụ: https://hkcode.onrender.com/api/admin
});

// Gắn token tự động
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ============================================================
   ADMIN: GET QUESTIONS OF A COURSE
   ============================================================ */
export const adminGetCourseQuestions = (courseId) =>
  API.get(`/courses/${courseId}/questions`);

/* ============================================================
   ADMIN: ANSWER A QUESTION
   ============================================================ */
export const adminAnswerCourseQuestion = (courseId, questionId, answer) =>
  API.post(`/courses/${courseId}/questions/${questionId}/answer`, {
    answer,
  });
