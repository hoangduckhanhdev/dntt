// src/pages/RegisterCourse.jsx
import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";

import { API_URL } from "../api/config";
import { createPayment } from "../api/ordersApi";
import slide3 from "../assets/images/slide3.jpg"; // ✅ IMPORT ẢNH ĐÚNG CÁCH

export default function RegisterCourse() {
  const { id: routeCourseId } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const queryCourseId = query.get("courseId");
  const stateCourseId = location.state?.courseId;

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    studentName: "",
    email: "",
    phone: "",
    courseId: "",
  });

  /* ===================== LOAD COURSES ===================== */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await axios.get(`${API_URL}/courses`);
        if (alive) setCourses(res.data || []);
      } catch (err) {
        console.error("❌ Không tải được danh sách khóa học:", err);
        alert("Không tải được danh sách khóa học!");
      } finally {
        if (alive) setCoursesLoading(false);
      }
    })();

    return () => (alive = false);
  }, []);

  /* ===================== PREFILL USER ===================== */
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u) {
        setForm((prev) => ({
          ...prev,
          studentName: prev.studentName || u.name || "",
          email: prev.email || u.email || "",
        }));
      }
    } catch {}
  }, []);

  /* ===================== AUTO-SELECT COURSE ===================== */
  useEffect(() => {
    if (!courses.length) return;

    const preferred =
      routeCourseId || queryCourseId || stateCourseId || courses[0]?._id;

    const exists = courses.some((c) => c._id === preferred);

    setForm((prev) => ({
      ...prev,
      courseId: exists ? preferred : courses[0]?._id || "",
    }));
  }, [courses, routeCourseId, queryCourseId, stateCourseId]);

  /* ===================== MAP COURSE INFO ===================== */
  const courseMap = useMemo(() => {
    const m = new Map();
    courses.forEach((c) => m.set(c._id, c));
    return m;
  }, [courses]);

  const selectedCourse = form.courseId ? courseMap.get(form.courseId) : null;
  const selectedPrice = selectedCourse?.price ?? 0;

  /* ===================== FORM CHANGE ===================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ===================== SUBMIT ===================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.studentName || !form.email || !form.phone || !form.courseId) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setLoading(true);

    try {
      const data = await createPayment({
        studentName: form.studentName,
        email: form.email,
        phone: form.phone,
        courseId: form.courseId,
      });

      const checkoutUrl = data?.data?.checkoutUrl || data?.checkoutUrl;
      if (!checkoutUrl) throw new Error("Server không trả về checkoutUrl");

      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("❌ Lỗi thanh toán:", err);
      alert(err?.message || "Không thể tạo đơn thanh toán");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== UI ===================== */
  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left panel */}
      <div className="md:w-1/2 bg-gradient-to-br from-orange-500 via-orange-400 to-orange-300 text-white flex flex-col justify-between p-10">
        <div>
          <h2 className="text-4xl font-extrabold mb-4 drop-shadow-md">
            Đăng ký ngay hôm nay!
          </h2>
          <p className="text-orange-50 mb-6 leading-relaxed text-justify">
            Cơ hội học hỏi từ giảng viên hàng đầu và phát triển kỹ năng của bạn.
            Hãy điền thông tin để bắt đầu hành trình học tập đầy cảm hứng!
          </p>
        </div>

        <motion.img
          src={slide3} // ✅ DÙNG IMPORT, KHÔNG DÙNG "/src/..."
          alt="Register Illustration"
          className="w-3/4 mx-auto rounded-2xl shadow-lg border border-white/30"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        />
      </div>

      {/* Right panel */}
      <div className="md:w-1/2 bg-white p-10 flex flex-col justify-center shadow-inner">
        <h2 className="text-3xl font-bold text-center text-orange-600 mb-6">
          Đăng ký khóa học
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 max-w-md mx-auto w-full"
        >
          {/* Name */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              name="studentName"
              value={form.studentName}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-orange-400 outline-none"
              placeholder="Nhập họ và tên..."
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-orange-400 outline-none"
              placeholder="Nhập email..."
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              pattern="^0[0-9]{9,10}$"
              title="Bắt đầu bằng 0, gồm 10–11 chữ số"
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-orange-400 outline-none"
              placeholder="Nhập số điện thoại..."
              required
            />
          </div>

          {/* Course */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Khóa học
            </label>

            <select
              name="courseId"
              value={form.courseId}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 w-full bg-white focus:ring-2 focus:ring-orange-400 outline-none"
              disabled={coursesLoading}
              required
            >
              {coursesLoading ? (
                <option>Đang tải khóa học…</option>
              ) : courses.length ? (
                courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))
              ) : (
                <option>Chưa có khóa học</option>
              )}
            </select>

            {selectedCourse && (
              <p className="mt-2 text-sm text-gray-600">
                Giá:{" "}
                <b className="text-orange-600">
                  {Number(selectedPrice).toLocaleString("vi-VN")} ₫
                </b>
              </p>
            )}
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading || coursesLoading || !form.courseId}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={`bg-gradient-to-r from-orange-500 to-orange-400 text-white w-full py-3 rounded-xl font-semibold shadow-md hover:opacity-90 transition ${
              loading || coursesLoading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Đang tạo đơn..." : "💳 Đăng ký & Thanh toán ngay"}
          </motion.button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Sau khi thanh toán, hệ thống sẽ tự động cập nhật trạng thái đơn hàng.
        </p>
      </div>
    </div>
  );
}
