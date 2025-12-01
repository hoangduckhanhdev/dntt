// src/api/examApi.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const examClient = axios.create({
  baseURL: API_BASE,
});

examClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const examApi = {
  /* ========== STUDENT API ========== */
  student: {
    start: async (examId) => {
      const res = await examClient.get(`/exams/${examId}/start`);
      return res.data;
    },
    autoSave: async (examId, answers) => {
      const res = await examClient.patch(`/exams/${examId}/attempt`, {
        answers,
      });
      return res.data;
    },
    submit: async (examId) => {
      const res = await examClient.post(`/exams/${examId}/submit`);
      return res.data;
    },
    getMyAttempts: async (examId) => {
      const res = await examClient.get(`/exams/${examId}/my-attempts`);
      return res.data;
    },

    // 👉 GIẢI THÍCH VÌ SAO ĐÚNG / SAI (học viên bấm nút ở trang kết quả)
    explainAnswer: async (payload) => {
      // payload: { questionId, questionContent, type, options, studentAnswer, score, maxScore }
      const res = await examClient.post(`/ai/explain-answer`, payload);
      return res.data;
    },
  },

  /* ========== ADMIN / TEACHER EXAM API ========== */
  admin: {
    getExams: async (params = {}) => {
      const res = await examClient.get(`/admin/exams`, { params });
      return res.data;
    },
    getExam: async (examId) => {
      const res = await examClient.get(`/admin/exams/${examId}`);
      return res.data;
    },
    createExam: async (payload) => {
      const res = await examClient.post(`/admin/exams`, payload);
      return res.data;
    },
    updateExam: async (examId, payload) => {
      const res = await examClient.put(`/admin/exams/${examId}`, payload);
      return res.data;
    },
    deleteExam: async (examId) => {
      const res = await examClient.delete(`/admin/exams/${examId}`);
      return res.data;
    },
    publishExam: async (examId, isPublished) => {
      const res = await examClient.put(`/admin/exams/${examId}/publish`, {
        isPublished,
      });
      return res.data;
    },
    getExamAttempts: async (examId) => {
      const res = await examClient.get(`/admin/exams/${examId}/attempts`);
      return res.data;
    },
    getAttemptDetail: async (examId, attemptId) => {
      const res = await examClient.get(
        `/admin/exams/${examId}/attempts/${attemptId}`
      );
      return res.data;
    },
    gradeAttempt: async (examId, attemptId, answers) => {
      const res = await examClient.put(
        `/admin/exams/${examId}/attempts/${attemptId}/grade`,
        { answers }
      );
      return res.data;
    },
  },

  /* ========== ADMIN / TEACHER QUESTION BANK ========== */
  questionBank: {
    getQuestions: async (params = {}) => {
      const res = await examClient.get(`/admin/exam-questions`, { params });
      return res.data;
    },
    getFilters: async (courseId) => {
      const res = await examClient.get(`/admin/exam-questions/filters`, {
        params: { course: courseId },
      });
      return res.data;
    },
    createQuestion: async (payload) => {
      const res = await examClient.post(`/admin/exam-questions`, payload);
      return res.data;
    },
    updateQuestion: async (id, payload) => {
      const res = await examClient.put(`/admin/exam-questions/${id}`, payload);
      return res.data;
    },
    deleteQuestion: async (id) => {
      const res = await examClient.delete(`/admin/exam-questions/${id}`);
      return res.data;
    },

    // 👉 AI sinh câu hỏi đa môn cho ngân hàng câu hỏi
    generateByAI: async (payload) => {
      // payload: { subject, topic, level, numQuestions, questionType, language, courseTitle? }
      const res = await examClient.post(`/ai/generate-questions`, payload);
      // response: { ok, questions:[...] }
      return res.data;
    },
  },

  /* ========== AI CHUNG ========== */
  ai: {
    // 📝 AI chấm tự luận
    gradeEssay: async ({ question, studentAnswer, maxScore }) => {
      const res = await examClient.post(`/ai/grade-essay`, {
        question,
        studentAnswer,
        maxScore,
      });
      return res.data;
    },

    // 🎓 Gia sư trong bài học (Lesson Tutor)
    // dùng ở màn hình học bài: gửi đoạn nội dung bài + câu hỏi của học viên
    lessonTutor: async (payload) => {
      
      const res = await examClient.post(`/ai/lesson-tutor`, payload);
      return res.data; // { ok, answer, suggestions? ... }
    },
  },
};

export default examApi;
