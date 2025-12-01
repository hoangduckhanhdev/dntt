// src/pages/TeacherExamList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import examApi from "../api/examApi";

export default function TeacherExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await examApi.admin.getExams(); // GET /api/admin/exams
      setExams(data || []);
    } catch (e) {
      console.error(e);
      alert("Lỗi tải danh sách đề thi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleTogglePublish = async (exam) => {
    const next = !exam.isPublished;
    if (
      !window.confirm(
        next
          ? "Xuất bản đề thi này cho học viên?"
          : "Gỡ xuất bản đề thi này? Học viên sẽ không còn thấy đề."
      )
    )
      return;

    try {
      setActionLoadingId(exam._id);
      await examApi.admin.publishExam(exam._id, next); // PUT /api/admin/exams/:id/publish
      await load();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể cập nhật trạng thái đề thi");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (exam) => {
    if (
      !window.confirm(
        "Xoá đề thi này? Nếu đã có học viên làm thì hệ thống sẽ không cho xoá."
      )
    )
      return;

    try {
      setActionLoadingId(exam._id);
      await examApi.admin.deleteExam(exam._id); // DELETE /api/admin/exams/:id
      await load();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Xoá đề thi thất bại");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-dark">
          📘 Danh sách đề thi / bài kiểm tra
        </h1>
        <Link
          to="/teacher/exams/create"
          className="px-4 py-2 bg-primary text-white rounded-xl shadow-soft hover:bg-accent transition"
        >
          + Tạo đề thi
        </Link>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="bg-white shadow-soft rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-primaryLight">
              <tr>
                <th className="py-3 px-4 text-left text-dark">Tiêu đề</th>
                <th className="py-3 px-4 text-left">Khóa học</th>
                <th className="py-3 px-4 text-left">Loại</th>
                <th className="py-3 px-4 text-left">Chọn câu hỏi</th>
                <th className="py-3 px-4 text-left">Trạng thái</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((ex) => (
                <tr key={ex._id} className="border-t border-border">
                  <td className="py-3 px-4">{ex.title}</td>
                  <td className="py-3 px-4">
                    {ex.course?.title || "—"}
                  </td>
                  <td className="py-3 px-4 capitalize">{ex.type}</td>
                  <td className="py-3 px-4">
                    {ex.selectionMode === "auto"
                      ? "Tự động từ ngân hàng"
                      : "Chọn thủ công"}
                  </td>
                  <td className="py-3 px-4">
                    {ex.isPublished ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Đã xuất bản
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                        Nháp
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Link
                      to={`/teacher/exams/${ex._id}`}
                      className="text-primary hover:text-accent font-medium"
                    >
                      Chi tiết
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleTogglePublish(ex)}
                      disabled={actionLoadingId === ex._id}
                      className="inline-flex items-center px-3 py-1 rounded-lg border text-xs font-semibold hover:bg-primaryLight disabled:opacity-60"
                    >
                      {ex.isPublished ? "Gỡ xuất bản" : "Xuất bản"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(ex)}
                      disabled={actionLoadingId === ex._id}
                      className="inline-flex items-center px-3 py-1 rounded-lg border border-red-300 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
              {exams.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 px-4 text-center text-muted"
                  >
                    Chưa có đề thi nào, hãy tạo mới.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
