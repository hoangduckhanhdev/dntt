// src/pages/admin/AdminExams.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import examApi from "../../api/examApi";

export default function AdminExams() {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await examApi.admin.getExams(); // GET /api/admin/exams
        setExams(Array.isArray(data) ? data : data.items || []);
      } catch (e) {
        console.error(e);
        setErr("Không tải được danh sách đề thi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredExams = useMemo(() => {
    if (!keyword.trim()) return exams;
    const kw = keyword.toLowerCase();
    return exams.filter((e) => {
      const title = (e.title || "").toLowerCase();
      const course = (e.course?.title || "").toLowerCase();
      return title.includes(kw) || course.includes(kw);
    });
  }, [exams, keyword]);

  const formatType = (t) => {
    if (t === "quiz") return "QUIZ";
    if (t === "exam") return "EXAM";
    if (t === "assignment") return "ASSIGNMENT";
    return t;
  };

  const formatTimeLimit = (t) => {
    if (!t && t !== 0) return "-";
    if (t === null) return "Không giới hạn";
    return `${t} phút`;
  };

  const handleTogglePublish = async (exam) => {
    try {
      const updated = await examApi.admin.publishExam(exam._id, !exam.isPublished);
      setExams((prev) =>
        prev.map((x) => (x._id === updated._id ? updated : x))
      );
    } catch (e) {
      console.error(e);
      alert("Không đổi được trạng thái công bố.");
    }
  };

  const handleDelete = async (exam) => {
    if (!window.confirm("Xoá đề thi này? Toàn bộ bài làm cũng sẽ bị xoá.")) return;
    try {
      await examApi.admin.deleteExam(exam._id);
      setExams((prev) => prev.filter((x) => x._id !== exam._id));
    } catch (e) {
      console.error(e);
      alert("Xoá đề thi thất bại.");
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Quản lý đề thi
          </h1>
          <p className="text-sm text-slate-500">
            Giáo viên có thể tạo đề kiểm tra / bài tập cho khoá học của mình.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/exams/new")}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold shadow-soft hover:bg-orange-600"
        >
          + Tạo đề thi
        </button>
      </div>

      {/* Tìm kiếm */}
      <div className="mb-4">
        <input
          type="text"
          className="w-full max-w-sm border border-slate-200 rounded-lg px-3 py-2 text-sm"
          placeholder="Tìm theo tiêu đề hoặc khoá học..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {err && (
        <p className="text-sm text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">
          {err}
        </p>
      )}

      <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
        {loading ? (
          <p className="px-4 py-6 text-sm text-slate-500">
            Đang tải danh sách đề thi...
          </p>
        ) : filteredExams.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">
            Chưa có đề thi nào.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Tiêu đề</th>
                  <th className="px-3 py-2 text-left">Khoá học</th>
                  <th className="px-3 py-2 text-left">Loại</th>
                  <th className="px-3 py-2 text-left">Thời gian (phút)</th>
                  <th className="px-3 py-2 text-left">Lượt làm</th>
                  <th className="px-3 py-2 text-left">Công bố</th>
                  <th className="px-3 py-2 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((e, idx) => (
                  <tr
                    key={e._id}
                    className="border-t border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-800">
                        {e.title}
                      </div>
                      {e.description && (
                        <div className="text-xs text-slate-500 truncate max-w-xs">
                          {e.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {e.course?.title || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {formatType(e.type)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {formatTimeLimit(e.timeLimit)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {/* nếu backend có countAttempts truyền sang thì hiển thị, tạm để 1 dấu gạch */}
                      {e.attemptsAllowed ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleTogglePublish(e)}
                        className={`px-2 py-1 rounded-full text-[11px] ${
                          e.isPublished
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        {e.isPublished ? "Đang mở" : "Đang ẩn"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Xem kết quả & bài làm học viên */}
                        <button
                          onClick={() =>
                            navigate(`/admin/exams/${e._id}/attempts`)
                          }
                          className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          Kết quả
                        </button>

                        {/* Sửa đề */}
                        <button
                          onClick={() =>
                            navigate(`/admin/exams/edit/${e._id}`)
                          }
                          className="px-3 py-1.5 rounded-lg text-xs bg-orange-500 text-white hover:bg-orange-600"
                        >
                          Sửa
                        </button>

                        {/* Xoá đề */}
                        <button
                          onClick={() => handleDelete(e)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
