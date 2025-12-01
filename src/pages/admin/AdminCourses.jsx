// src/pages/admin/AdminCourses.jsx
import React, { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Eye,
  Users,
  MessageCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";

import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../api/adminCourseApi";
import { getAllCategories } from "../../api/adminCategoryApi";
import AdminCourseForm from "./AdminCourseForm";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await getAllCourses();

      // Chuẩn hoá: chấp mọi định dạng trả về
      const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      // Bổ sung mặc định cho thống kê Q&A (nếu có)
      const list = rawList.map((c) => ({
        ...c,
        qnaTotal:
          c.qnaTotal ??
          c.qna_count ??
          0, // tổng câu hỏi (nếu backend có trả về)
        qnaUnanswered:
          c.qnaUnanswered ??
          c.unansweredQuestions ??
          0, // số câu chưa trả lời – dùng cho badge
      }));

      setCourses(list);
    } catch (err) {
      console.error("❌ Lỗi khi tải khóa học:", err);
      Swal.fire("Lỗi!", "Không thể tải danh sách khóa học.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getAllCategories();
      setCategories(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh mục:", err);
    }
  };

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setShowForm(true);
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setShowForm(true);
  };

  const handleDeleteCourse = async (id) => {
    const confirm = await Swal.fire({
      title: "🗑 Xóa khóa học?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f87171",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (!confirm.isConfirmed) return;

    try {
      await deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c._id !== id));
      Swal.fire("🗑 Đã xóa!", "Khóa học đã bị xóa.", "success");
    } catch (err) {
      console.error("❌ Lỗi khi xóa:", err);
      Swal.fire("Lỗi!", "Không thể xóa khóa học.", "error");
    }
  };

  const filtered = courses.filter((c) =>
    (c.title || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <p className="text-center mt-10 text-orange-400 animate-pulse text-lg">
        ⏳ Đang tải dữ liệu khóa học...
      </p>
    );
  }

  return (
    <div className="p-6 bg-orange-50 min-h-screen rounded-xl shadow-inner">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-orange-600">
          📚 Quản lý khóa học
        </h1>
        <button
          onClick={handleAddCourse}
          className="flex items-center gap-2 bg-orange-400 hover:bg-orange-500 text-white text-sm px-4 py-2 rounded-lg shadow-md transition-all"
        >
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔎 Tìm theo tên khóa học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-orange-200 focus:ring focus:ring-orange-100 focus:border-orange-300 px-3 py-2 rounded-lg w-full md:w-80 bg-white transition"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full border-collapse">
          <thead className="bg-orange-100 text-orange-800">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">#</th>
              <th className="px-4 py-2 text-left font-semibold">Ảnh</th>
              <th className="px-4 py-2 text-left font-semibold">Tên khóa học</th>
              <th className="px-4 py-2 text-left font-semibold">Danh mục</th>
              <th className="px-4 py-2 text-left font-semibold">Mô tả</th>
              <th className="px-4 py-2 text-left font-semibold">Giảng viên</th>
              <th className="px-4 py-2 text-left font-semibold">Giá</th>
              {/* 🔢 Cột số học viên */}
              <th className="px-4 py-2 text-left font-semibold">Học viên</th>
              <th className="px-4 py-2 text-left font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                {/* 9 cột => colSpan = 9 */}
                <td
                  colSpan={9}
                  className="text-center py-6 text-gray-500 italic"
                >
                  Không có khóa học nào.
                </td>
              </tr>
            ) : (
              filtered.map((course, idx) => {
                const unanswered = Number(
                  course.qnaUnanswered || course.unansweredQuestions || 0
                );

                return (
                  <tr
                    key={course._id}
                    className="border-b hover:bg-orange-50 transition-colors"
                  >
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <img
                        src={
                          course.image ||
                          "https://via.placeholder.com/80x80?text=No+Image"
                        }
                        alt={course.title}
                        className="w-16 h-16 object-cover rounded-lg border border-orange-100 shadow-sm"
                        loading="lazy"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {course.title}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {typeof course.category === "string"
                        ? course.category
                        : course.category?.name || "Chưa có"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {course.description || "Chưa có mô tả"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {typeof course.teacher === "string"
                        ? course.teacher
                        : course.teacher?.name || "Đang cập nhật"}
                    </td>
                    <td className="px-4 py-3 text-orange-600 font-semibold">
                      {(Number(course.price) || 0).toLocaleString("vi-VN")} ₫
                    </td>

                    {/* 🔢 Số học viên đã đăng ký (server trả về studentsCount) */}
                    <td className="px-4 py-3 text-gray-700 font-semibold">
                      {Number(
                        course.studentsCount || course.students || 0
                      ).toLocaleString("vi-VN")}
                    </td>

                    <td className="px-4 py-3 flex flex-wrap gap-2">
                      {/* Xem public */}
                      <a
                        href={`/course/${course._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white border border-orange-300 text-orange-700 px-2 py-1 rounded-md hover:bg-orange-50 transition inline-flex items-center gap-1"
                        title="Xem trang khoá học (public)"
                      >
                        <Eye size={14} /> Xem
                      </a>

                      {/* Chỉnh outline */}
                      <Link
                        to={`/admin/courses/edit/${course._id}/curriculum`}
                        className="bg-white border border-amber-300 text-amber-700 px-2 py-1 rounded-md hover:bg-amber-50 transition inline-flex items-center gap-1"
                        title="Chỉnh outline (chương/bài + video demo)"
                      >
                        <BookOpen size={14} /> Outline
                      </Link>

                      {/* 🔹 Học viên của khóa */}
                      <Link
                        to={`/admin/courses/${course._id}/students`}
                        className="bg-white border border-emerald-300 text-emerald-700 px-2 py-1 rounded-md hover:bg-emerald-50 transition inline-flex items-center gap-1"
                        title="Xem danh sách học viên & tiến độ"
                      >
                        <Users size={14} /> Học viên
                      </Link>

                      {/* 🔹 Q&A của khóa + badge số câu hỏi chưa trả lời */}
                      <Link
                        to={`/admin/courses/${course._id}/questions`}
                        className="bg-white border border-sky-300 text-sky-700 px-2 py-1 rounded-md hover:bg-sky-50 transition inline-flex items-center gap-1"
                        title="Xem & trả lời câu hỏi của học viên"
                      >
                        <MessageCircle size={14} />
                        <span>Q&amp;A</span>
                        {unanswered > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[11px] font-bold rounded-full bg-red-500 text-white">
                            {unanswered}
                          </span>
                        )}
                      </Link>

                      {/* Sửa thông tin cơ bản */}
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="bg-orange-400 hover:bg-orange-500 text-white px-2 py-1 rounded-md transition inline-flex items-center gap-1"
                        title="Sửa thông tin"
                      >
                        <Edit size={14} /> Sửa
                      </button>

                      {/* Xoá */}
                      <button
                        onClick={() => handleDeleteCourse(course._id)}
                        className="bg-red-400 hover:bg-red-500 text-white px-2 py-1 rounded-md transition inline-flex items-center gap-1"
                        title="Xoá khoá học"
                      >
                        <Trash2 size={14} /> Xoá
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal form thêm/sửa */}
      {showForm && (
        <AdminCourseForm
          course={selectedCourse}
          categories={categories}
          onSaved={(saved) => {
            if (selectedCourse) {
              setCourses((prev) =>
                prev.map((c) => (c._id === saved._id ? saved : c))
              );
            } else {
              setCourses((prev) => [saved, ...prev]);
            }
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
