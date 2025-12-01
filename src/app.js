// ======================= 🔹 IMPORTS CƠ BẢN 🔹 =======================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const passport = require("passport");
const path = require("path");
const { errorHandler, notFound } = require("./middlewares/errorHandler");

require("./config/passport");

const app = express();

// ======================= 🔹 CẤU HÌNH CORS 🔹 =======================
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const corsOptions = {
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight

// ======================= 🔹 MIDDLEWARES 🔹 =======================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(passport.initialize());

// Static uploads (nếu bạn dùng)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ======================= 🔹 IMPORT ROUTES 🔹 =======================

// 🧭 ADMIN
const dashboardRoutes = require("./routes/admin/dashboardRoutes");
const adminUserRoutes = require("./routes/admin/adminUserRoutes");
const adminCourseRoutes = require("./routes/admin/adminCourseRoutes");
const adminCategoryRoutes = require("./routes/admin/adminCategoryRoutes");
const adminTeacherRoutes = require("./routes/admin/adminTeacherRoutes");
const adminBlogRoutes = require("./routes/admin/adminBlogRoutes");
const adminProfileRoutes = require("./routes/admin/adminProfileRoutes");
const adminSearchRoutes = require("./routes/admin/searchRoutes");
const adminNotificationRoutes = require("./routes/admin/adminNotificationRoutes");
const adminExamQuestionBankRoutes = require("./routes/admin/examQuestionAdminRoutes");
const adminExamRoutes = require("./routes/admin/examAdminRoutes");
const adminSkillRoutes = require("./routes/admin/adminSkillRoutes");
const adminStudyRoomRoutes = require("./routes/admin/adminStudyRoomRoutes");

// 🧭 CLIENT
const homeRoutes = require("./routes/homeRoutes");
const contactRoutes = require("./routes/contactRoutes");
const aboutRoutes = require("./routes/aboutRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const registerCourseRoutes = require("./routes/registerCourseRoutes");
const paymentRoutes = require("./routes/payment");
const blogRoutes = require("./routes/blogRoutes");
const statsRoutes = require("./routes/statsRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const orderRoutes = require("./routes/orderRoutes");
const learningRoutes = require("./routes/learningRoutes");
const progressRoutes = require("./routes/progressRoutes");
const examRoutes = require("./routes/examRoutes");
const feedRoutes = require("./routes/feedRoutes");
const studyRoomRoutes = require("./routes/studyRoomRoutes");

// 🧭 AI CHAT & MEDIA
const aiRoutes = require("./routes/aiRoutes");          // Chat + chấm tự luận
const audioRoutes = require("./routes/audioRoutes");    // STT + TTS
const uploadRoutes = require("./routes/uploadRoutes");  // Upload ảnh

// ======================= 🔹 ROUTES CLIENT 🔹 =======================
app.use("/api/home", homeRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/registercourse", registerCourseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/study-rooms", studyRoomRoutes);

// learning (khu học tập)
app.use("/api", learningRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/exams", examRoutes);

// ======================= 🔹 AI ROUTES 🔹 =======================
// Chatbox + chấm tự luận (grade-essay)
app.use("/api/ai", aiRoutes);          // POST /api/ai/chat, POST /api/ai/grade-essay

// STT/TTS để namespace riêng, tránh đè route
app.use("/api/ai/audio", audioRoutes); // VD: POST /api/ai/audio/stt, /api/ai/audio/tts

// Upload ảnh (dùng cho AI / chat nếu cần)
app.use("/api/upload", uploadRoutes);  // POST /api/upload/image

// ======================= 🔹 ADMIN ROUTES 🔹 =======================
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/courses", adminCourseRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/teachers", adminTeacherRoutes);
app.use("/api/admin/blogs", adminBlogRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/admin/search", adminSearchRoutes);
app.use("/api/admin/profile", adminProfileRoutes);
app.use("/api/admin/exam-questions", adminExamQuestionBankRoutes);
app.use("/api/admin/exams", adminExamRoutes);
app.use("/api/admin", adminSkillRoutes);
app.use("/api/admin/study-rooms", adminStudyRoomRoutes);

// ======================= 🔹 ERROR HANDLERS 🔹 =======================
app.use(notFound);
app.use(errorHandler);

// ✅ Socket.IO sẽ được inject từ server.js
module.exports = app;
