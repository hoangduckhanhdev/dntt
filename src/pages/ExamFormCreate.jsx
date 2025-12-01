// src/pages/ExamFormCreate.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import examApi from "../api/examApi";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export default function ExamFormCreate() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);

  const [form, setForm] = useState({
    course: "",
    title: "",
    description: "",
    type: "quiz", // quiz | exam | assignment
    timeLimit: 30,
    attemptsAllowed: 1,
    shuffleQuestions: true,
    shuffleOptions: true,
    selectionMode: "manual",
    assignedClasses: [], // danh sách lớp được giao
  });

  // ===================== LOAD COURSES =====================
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/admin/courses`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: { page: 1, limit: 1000 },
        });

        // BE trả về { data: [...] }
        setCourses(res.data?.data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách khoá học:", err);
      }
    };

    fetchCourses();
  }, []);

  // ===================== LOAD CLASSES KHI CHỌN KHOÁ =====================
  useEffect(() => {
    const fetchClasses = async () => {
      if (!form.course) {
        setClasses([]);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_BASE}/admin/courses/${form.course}/classes`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        setClasses(res.data || []);
      } catch (err) {
        console.error("Lỗi lấy danh sách lớp:", err);
        setClasses([]);
      }
    };

    fetchClasses();
  }, [form.course]);

  // ===================== HANDLERS =====================
  const handleChange = (field) => (e) => {
    let value = e.target.value;

    // số
    if (field === "timeLimit" || field === "attemptsAllowed") {
      value = value === "" ? "" : Number(value);
    }

    // chọn loại đề: nếu là assignment thì timeLimit = 0
    if (field === "type") {
      setForm((prev) => ({
        ...prev,
        type: value,
        timeLimit: value === "assignment" ? 0 : prev.timeLimit || 30,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckbox = (field) => (e) => {
    const { checked } = e.target;
    setForm((prev) => ({ ...prev, [field]: checked }));
  };

  const handleClassesChange = (e) => {
    const options = Array.from(e.target.selectedOptions);
    const ids = options.map((opt) => opt.value);
    setForm((prev) => ({ ...prev, assignedClasses: ids }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.course || !form.title) {
      alert("Vui lòng chọn khoá học và nhập tiêu đề đề thi.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        course: form.course,
        title: form.title,
        description: form.description,
        type: form.type, // quiz | exam | assignment

        selectionMode: "manual",
        questions: [], // phần cấu hình câu hỏi chi tiết làm sau

        assignedClasses: form.assignedClasses,
        accessMode: "class_only",

        timeLimit: form.type === "assignment" ? null : Number(form.timeLimit || 0),
        attemptsAllowed: Number(form.attemptsAllowed || 1),

        shuffleQuestions: !!form.shuffleQuestions,
        shuffleOptions: !!form.shuffleOptions,

        showScoreToStudent: true,
        showCorrectAnswers: false,
        revealAnswersMode: "after_due",
      };

      await examApi.admin.createExam(payload);

      alert("Tạo đề thành công");
      // tuỳ route danh sách đề thi của bạn
      navigate("/teacher/exams");
    } catch (err) {
      console.error(err);
      alert("Tạo đề thi thất bại");
    } finally {
      setLoading(false);
    }
  };

  // ===================== RENDER =====================
  const typeOptions = [
    { value: "quiz", label: "Quiz / kiểm tra chương" },
    { value: "exam", label: "Thi giữa kỳ / cuối kỳ" },
    { value: "assignment", label: "Bài tập (tự luận / nộp file)" }, // bài tập về nhà
  ];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-semibold text-slate-800 mb-2">
        Tạo đề thi mới
      </h1>
      <p className="text-slate-500 mb-6">
        Chọn khoá học, lớp học và cấu hình cơ bản cho đề thi / bài tập.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 space-y-5"
      >
        {/* Khoá học */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Khoá học <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={form.course}
            onChange={handleChange("course")}
          >
            <option value="">-- Chọn khoá học --</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Lớp học */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Lớp học (nếu có nhiều lớp cho khoá này)
          </label>
          <select
            multiple
            className="w-full border rounded-xl px-3 py-2 h-28 focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={form.assignedClasses}
            onChange={handleClassesChange}
            disabled={!form.course || classes.length === 0}
          >
            {classes.length === 0 && (
              <option value="">(Khoá này chưa có lớp riêng)</option>
            )}
            {classes.map((cl) => (
              <option key={cl._id} value={cl._id}>
                {cl.name} {cl.code ? `- ${cl.code}` : ""}{" "}
                {cl.semester || cl.year ? `(${cl.semester || ""} ${cl.year || ""})` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">
            Giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều lớp.
            Nếu không chọn lớp nào thì đề áp dụng cho toàn bộ học viên khoá học.
          </p>
        </div>

        {/* Tiêu đề */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tiêu đề đề thi <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={form.title}
            onChange={handleChange("title")}
            placeholder="Ví dụ: Quiz chương 1, Thi giữa kỳ..."
          />
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Mô tả
          </label>
          <textarea
            className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[80px]"
            value={form.description}
            onChange={handleChange("description")}
            placeholder="Ghi chú cho học viên về nội dung, phạm vi đề thi / bài tập..."
          />
        </div>

        {/* Loại đề + thời gian + số lần */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Loại đề */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Loại đề
            </label>
            <select
              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={form.type}
              onChange={handleChange("type")}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Thời gian */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Thời gian (phút)
            </label>
            <input
              type="number"
              min="0"
              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={
                form.type === "assignment"
                  ? ""
                  : form.timeLimit === 0
                  ? ""
                  : form.timeLimit
              }
              onChange={handleChange("timeLimit")}
              disabled={form.type === "assignment"}
              placeholder={
                form.type === "assignment"
                  ? "Bài tập về nhà: không giới hạn, tính theo hạn nộp"
                  : "0 = không giới hạn"
              }
            />
            {form.type !== "assignment" && (
              <p className="text-xs text-slate-400 mt-1">
                0 = không giới hạn thời gian (chỉ đóng khi hết hạn mở đề).
              </p>
            )}
          </div>

          {/* Số lần làm */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Số lần làm
            </label>
            <input
              type="number"
              min="1"
              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={form.attemptsAllowed}
              onChange={handleChange("attemptsAllowed")}
            />
          </div>
        </div>

        {/* Tuỳ chọn */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.shuffleQuestions}
              onChange={handleCheckbox("shuffleQuestions")}
            />
            <span>Xáo trộn thứ tự câu hỏi</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.shuffleOptions}
              onChange={handleCheckbox("shuffleOptions")}
            />
            <span>Xáo trộn thứ tự đáp án</span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? "Đang tạo..." : "Tạo đề thi"}
          </button>
        </div>
      </form>
    </div>
  );
}
