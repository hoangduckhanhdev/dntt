import axios from "axios";

/* ============================================================
   INSTANCE ADMIN (/api/admin)
   – dùng cho quản trị: courses, students, progress
   ============================================================ */
const ADMIN_API = axios.create({
  baseURL: "http://localhost:5000/api/admin",
});

ADMIN_API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

/* ============================================================
   INSTANCE LEARNING (/api)
   – dùng cho Q&A, trang học, học viên gửi câu hỏi / giáo viên trả lời
   ============================================================ */
const LEARNING_API = axios.create({
  baseURL: "http://localhost:5000/api",
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
   Q&A – Dùng chung backend (learningRoutes)
   ============================================================ */
// Lấy danh sách câu hỏi của học viên
export const getCourseQuestions = (courseId) =>
  LEARNING_API.get(`/courses/${courseId}/questions`);

// Giáo viên/admin trả lời câu hỏi
export const answerCourseQuestion = (courseId, questionId, data) =>
  LEARNING_API.patch(
    `/courses/${courseId}/questions/${questionId}/answer`,
    data
  );
