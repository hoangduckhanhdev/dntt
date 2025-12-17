import axios from "axios";
import { API_URL, ADMIN_API_URL } from "./config";

const ADMIN_API = axios.create({
  baseURL: ADMIN_API_URL,
});

ADMIN_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

const LEARNING_API = axios.create({
  baseURL: API_URL,
});

LEARNING_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

/* ===== COURSES ===== */
export const getAllCourses = () => ADMIN_API.get("/courses");
export const createCourse = (data) => ADMIN_API.post("/courses", data);
export const updateCourse = (id, data) =>
  ADMIN_API.put(`/courses/${id}`, data);
export const deleteCourse = (id) =>
  ADMIN_API.delete(`/courses/${id}`);
export const getDropdowns = () =>
  ADMIN_API.get("/courses/dropdowns");

/* ===== STUDENTS ===== */
export const getCourseStudents = (courseId) =>
  ADMIN_API.get(`/courses/${courseId}/students`);

export const getStudentProgress = (courseId, userId) =>
  ADMIN_API.get(`/courses/${courseId}/students/${userId}/progress`);

export const cancelCourseStudent = (courseId, registerId) =>
  ADMIN_API.patch(
    `/courses/${courseId}/students/${registerId}/cancel`,
    {} // ⚠️ nên truyền body rỗng để tránh lỗi Express
  );

/* ===== QUESTIONS ===== */
export const getCourseQuestions = (courseId) =>
  ADMIN_API.get(`/courses/${courseId}/questions`);

export const answerCourseQuestion = (courseId, questionId, data) =>
  ADMIN_API.post(
    `/courses/${courseId}/questions/${questionId}/answer`,
    data
  );
