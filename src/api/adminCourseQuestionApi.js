import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/admin",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Lấy Q&A của 1 khoá học
export const adminGetCourseQuestions = (courseId) =>
  API.get(`/courses/${courseId}/questions`);

// Trả lời 1 câu hỏi
export const adminAnswerCourseQuestion = (courseId, questionId, answer) =>
  API.post(`/courses/${courseId}/questions/${questionId}/answer`, { answer });
