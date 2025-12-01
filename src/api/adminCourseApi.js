// src/api/courseApi.js
import axios from "axios";
import { API_URL, ADMIN_API_URL } from "./config";

/* ============================================================
   INSTANCE ADMIN (/api/admin)
   ============================================================ */
const ADMIN_API = axios.create({
  baseURL: ADMIN_API_URL, // ví dụ: https://hkcode.onrender.com/api/admin
});

ADMIN_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

/* ============================================================
   INSTANCE LEARNING (/api)
   ============================================================ */
const LEARNING_API = axios.create({
  baseURL: API_URL, // ví dụ: https://hkcode.onrender.com/api
});

LEARNING_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

/* ============================================================
   ADMIN – CRUD COURSES
   ============================================================ */
export const getAllCourses = () => ADMIN_API.get("/courses");

export const createCourse = (data) => ADMIN_API.post("/courses", data);

export const updateCourse = (id, data) =>
  ADMIN_API.put(`/courses/${id}`, data);

export const deleteCourse = (id) => ADMIN_API.delete(`/courses/${id}`);

export const getDropdowns = () => ADMIN_API.get("/courses/dropdowns");

/* ============================================================
   ADMIN – STUDENTS + PROGRESS
   ============================================================ */
export const getCourseStudents = (courseId) =>
  ADMIN_API.get(`/courses/${courseId}/students`);

export const getStudentProgress = (courseId, userId) =>
  ADMIN_API.get(`/courses/${courseId}/students/${userId}/progress`);

/* ============================================================
   Q&A – Learning Side (Học viên – Giáo viên)
   ============================================================ */
export const getCourseQuestions = (courseId) =>
  LEARNING_API.get(`/courses/${courseId}/questions`);

export const answerCourseQuestion = (courseId, questionId, data) =>
  LEARNING_API.patch(
    `/courses/${courseId}/questions/${questionId}/answer`,
    data
  );
