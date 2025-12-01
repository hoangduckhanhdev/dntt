// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { getSocket } from "./hooks/useSocket";

// Layouts
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

// User pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CategoriesPage from "./pages/Categories";
import Courses from "./pages/Courses";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import CourseDetail from "./pages/CourseDetail";
import Teachers from "./pages/Teachers";
import TeacherDetail from "./pages/TeacherDetail";
import RegisterCourse from "./pages/RegisterCourse";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import RegisterFail from "./pages/RegisterFail";
import RegisterSuccess from "./pages/RegisterSuccess";
import MyCourses from "./pages/MyCourses";
import ThankYou from "./pages/ThankYou";
import OrderDetail from "./pages/OrderDetail";
import TeacherExamList from "./pages/TeacherExamList";
import TeacherExamDetail from "./pages/TeacherExamDetail";
import ExamFormCreate from "./pages/ExamFormCreate";
import StudentExamDo from "./pages/StudentExamDo";
import CourseLearn from "./pages/CourseLearn";
import LearnFeedPage from "./pages/LearnFeedPage";
import StudentSkillReport from "./pages/StudentSkillReport";
import StudyRoomList from "./pages/StudyRoomList";
import StudyRoomDetail from "./pages/StudyRoomDetail";
// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseForm from "./pages/admin/AdminCourseForm";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminTeachers from "./pages/admin/AdminTeachers";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCourseStudents from "./pages/admin/AdminCourseStudents";
import AdminCourseQuestions from "./pages/admin/AdminCourseQuestions";
import AdminCourseCurriculum from "./pages/admin/AdminCourseCurriculum";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSearch from "./pages/admin/AdminSearch";
import AdminExams from "./pages/admin/AdminExams";
import AdminExamForm from "./pages/admin/AdminExamForm";
import StudentExamResult from "./pages/StudentExamResult";
import AdminFeed from "./pages/admin/AdminFeed";
import CourseSkillMapPage from "./pages/CourseSkillMapPage";
import AdminCourseSkillMapEditor from "./pages/admin/AdminCourseSkillMapEditor";
import AdminSkillList from "./pages/admin/AdminSkillList";
import AdminStudyRooms from "./pages/admin/AdminStudyRooms";

import AdminExamAttempts from "./pages/admin/AdminExamAttempts";
import AdminExamAttemptDetail from "./pages/admin/AdminExamAttemptDetail";

import AdminQuestionBank from "./pages/admin/AdminQuestionBank";
import AdminQuestionForm from "./pages/admin/AdminQuestionForm";

export default function App() {
  useEffect(() => {
    const socket = getSocket();
    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", (reason) =>
      console.log("Socket disconnected:", reason)
    );
    return () => socket.disconnect();
  }, []);

  return (
    <div className="bg-gradient-to-b from-orange-50 via-yellow-50 to-white min-h-screen">
      <Routes>
        {/* USER */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="courses" element={<Courses />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/:slug" element={<CategoriesPage />} />
          <Route path="registercourse" element={<RegisterCourse />} />
          <Route path="registercourse/:id" element={<RegisterCourse />} />
          <Route path="teacher" element={<Teachers />} />
          <Route path="teacher/:id" element={<TeacherDetail />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="course/:id" element={<CourseDetail />} />
          <Route path="blog" element={<BlogList />} />
          <Route path="blog/:slug" element={<BlogDetail />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="profile" element={<Profile />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="cart" element={<Cart />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
          <Route path="thank-you" element={<ThankYou />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="register-fail" element={<RegisterFail />} />
          <Route path="register-success" element={<RegisterSuccess />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="/courses/:courseId/skill-map" element={<CourseSkillMapPage />} />
          <Route path="/learning/skill-report" element={<StudentSkillReport />} />
          <Route path="/study-rooms" element={<StudyRoomList />} />
          <Route path="/study-rooms/:roomId" element={<StudyRoomDetail />} />
          {/* 🔹 LearnFeed - Bảng tin học tập (dùng UserLayout) */}
          <Route path="learn-feed" element={<LearnFeedPage />} />

          {/* Teacher */}
          <Route path="teacher/exams" element={<TeacherExamList />} />
          <Route path="teacher/exams/create" element={<ExamFormCreate />} />
          <Route path="teacher/exams/:id" element={<TeacherExamDetail />} />

          {/* Student exam */}
          <Route path="exams/:id/do" element={<StudentExamDo />} />
          <Route path="exams/:id/result" element={<StudentExamResult />} />
          <Route path="learning/:id" element={<CourseLearn />} />
        </Route>

        {/* ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="courses/new" element={<AdminCourseForm />} />
          <Route path="courses/edit/:id" element={<AdminCourseForm />} />
          <Route
            path="courses/edit/:id/curriculum"
            element={<AdminCourseCurriculum />}
          />
          <Route
            path="courses/:id/students"
            element={<AdminCourseStudents />}
          />
          <Route
            path="courses/:id/questions"
            element={<AdminCourseQuestions />}
          />
          <Route
            path="/admin/courses/:courseId/skills"
            element={<AdminCourseSkillMapEditor />}
          />
          <Route path="/admin/skills" element={<AdminSkillList />} />
          {/* Exams */}
          <Route path="exams" element={<AdminExams />} />
          <Route path="exams/new" element={<AdminExamForm />} />
          <Route path="exams/edit/:id" element={<AdminExamForm />} />

          {/* Exam attempts */}
          <Route path="exams/:id/attempts" element={<AdminExamAttempts />} />
          <Route
            path="exams/:id/attempts/:attemptId"
            element={<AdminExamAttemptDetail />}
          />
          <Route path="study-rooms" element={<AdminStudyRooms />} />

          <Route path="exam-questions" element={<AdminQuestionBank />} />
          <Route path="exam-questions/new" element={<AdminQuestionForm />} />
          <Route
            path="exam-questions/edit/:id"
            element={<AdminQuestionForm />}
          />
          <Route path="feed" element={<AdminFeed />} />

          <Route path="categories" element={<AdminCategories />} />
          <Route path="blogs" element={<AdminBlogs />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="search" element={<AdminSearch />} />
        </Route>
      </Routes>
    </div>
  );
}
