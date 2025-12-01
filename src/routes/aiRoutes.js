const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  chat,
  gradeEssay,
  explainAnswer,
  generateQuestionsByAI, // AI sinh câu hỏi đa môn
  lessonTutor,          // 👈 THÊM: Gia sư trong bài học
} = require("../controllers/aiController");
const {
  generateSkillMapFromEntryTest,
  analyzeLearningPathAfterExam,
  getUserSkillProfile,
} = require("../controllers/aiAdvisorController");

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// 💬 Chat tư vấn khoá học
router.post("/chat", limiter, chat);

// 📝 AI chấm tự luận
router.post("/grade-essay", limiter, gradeEssay);

// 🔍 AI giải thích đúng / sai từng câu
router.post("/explain-answer", limiter, explainAnswer);

// 🎯 AI sinh câu hỏi đa môn
router.post("/generate-questions", limiter, generateQuestionsByAI);

// 🎓 AI gia sư trong bài học (Lesson Tutor)
router.post("/lesson-tutor", limiter, lessonTutor);

// 🎯 Skill Map & Learning Path
router.post(
  "/skill-map-from-entry-test",
  limiter,
  generateSkillMapFromEntryTest
);
router.post(
  "/learning-path-after-exam",
  limiter,
  analyzeLearningPathAfterExam
);
router.get("/user-skill-profile", limiter, getUserSkillProfile);

module.exports = router;
