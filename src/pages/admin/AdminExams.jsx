import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import examApi from "../../api/examApi";

const API_BASE = "http://localhost:5000/api";

export default function AdminExams() {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // ✅ filter theo course khi tạo mới
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseFilter, setCourseFilter] = useState(""); // courseId

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`${API_BASE}/admin/courses`, {
        headers,
        params: { page: 1, limit: 1000 },
      });

      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
        ? data.items
        : [];

      setCourses(list);
    } catch (e) {
      console.error("Không tải được danh sách khoá học:", e?.response?.data || e);
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      setErr("");

      // nếu backend có hỗ trợ lọc theo course, truyền params; không thì vẫn ok (frontend filter)
      let data;
      try {
        data = await examApi.admin.getExams(courseFilter ? { course: courseFilter } : {});
      } catch {
        // fallback nếu getExams không nhận params
        data = await examApi.admin.getExams();
      }

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setExams(items);
    } catch (e) {
      console.error(e);
      setErr("Không tải được danh sách đề thi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // khi đổi khoá học filter -> load lại
  useEffect(() => {
    fetchExams();
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFilter]);

  const filteredExams = useMemo(() => {
    let list = exams;

    // filter theo course (frontend) để chắc chắn đúng
    if (courseFilter) {
      list = list.filter((e) => String(e.course?._id || e.course || "") === String(courseFilter));
    }

    if (!keyword.trim()) return list;

    const kw = keyword.toLowerCase();
    return list.filter((e) => {
      const title = (e.title || "").toLowerCase();
      const course = (e.course?.title || "").toLowerCase();
      return title.includes(kw) || course.includes(kw);
    });
  }, [exams, keyword, courseFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedExams = filteredExams.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

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
      // một số backend trả {data: exam}, fallback
      const next = updated?.data || updated;
      setExams((prev) => prev.map((x) => (x._id === next._id ? next : x)));
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

  // ✅ Tạo đề thi: truyền course sang form để có dropdown chương/tags ngay
  const handleCreateExam = () => {
    if (courseFilter) navigate(`/admin/exams/new?course=${courseFilter}`);
    else navigate("/admin/exams/new");
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Quản lý đề thi</h1>
          <p className="text-sm text-slate-500">
            Giáo viên có thể tạo đề kiểm tra / bài tập cho khoá học của mình.
          </p>
        </div>

        <button
          onClick={handleCreateExam}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold shadow-soft hover:bg-orange-600"
        >
          + Tạo đề thi
        </button>
      </div>

      {/* ✅ filter course + search */}
      <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="w-full md:w-[360px]">
          <label className="text-xs text-slate-500">Lọc theo khoá học</label>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <option value="">(Tất cả khoá học)</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title || c.name}
              </option>
            ))}
          </select>
          {loadingCourses && <div className="text-[11px] text-slate-400 mt-1">Đang tải khoá học...</div>}
        </div>

        <div className="flex-1">
          <label className="text-xs text-slate-500">Tìm kiếm</label>
          <input
            type="text"
            className="w-full max-w-xl border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Tìm theo tiêu đề hoặc khoá học..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="md:pt-5">
          <button
            onClick={fetchExams}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
          >
            Làm mới
          </button>
        </div>
      </div>

      {err && <p className="text-sm text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

      <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
        {loading ? (
          <p className="px-4 py-6 text-sm text-slate-500">Đang tải danh sách đề thi...</p>
        ) : filteredExams.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">Chưa có đề thi nào.</p>
        ) : (
          <>
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
                  {paginatedExams.map((e, idx) => {
                    const displayIndex = startIndex + idx + 1;
                    return (
                      <tr key={e._id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-3 py-2 text-xs text-slate-500">{displayIndex}</td>

                        <td className="px-3 py-2">
                          <div className="font-semibold text-slate-800">{e.title}</div>
                          {e.description && (
                            <div className="text-xs text-slate-500 truncate max-w-xs">{e.description}</div>
                          )}
                        </td>

                        <td className="px-3 py-2 text-xs text-slate-700">{e.course?.title || "—"}</td>
                        <td className="px-3 py-2 text-xs text-slate-700">{formatType(e.type)}</td>
                        <td className="px-3 py-2 text-xs text-slate-700">{formatTimeLimit(e.timeLimit)}</td>
                        <td className="px-3 py-2 text-xs text-slate-700">{e.attemptsAllowed ?? "—"}</td>

                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleTogglePublish(e)}
                            className={`px-2 py-1 rounded-full text-[11px] ${
                              e.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"
                            }`}
                          >
                            {e.isPublished ? "Đang mở" : "Đang ẩn"}
                          </button>
                        </td>

                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/admin/exams/${e._id}/attempts`)}
                              className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 text-slate-700 hover:bg-slate-200"
                            >
                              Kết quả
                            </button>

                            <button
                              onClick={() => navigate(`/admin/exams/edit/${e._id}`)}
                              className="px-3 py-1.5 rounded-lg text-xs bg-orange-500 text-white hover:bg-orange-600"
                            >
                              Sửa
                            </button>

                            <button
                              onClick={() => handleDelete(e)}
                              className="px-3 py-1.5 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              Xoá
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm text-slate-600 border-t border-slate-100">
              <div>
                Hiển thị{" "}
                <span className="font-semibold">
                  {startIndex + 1}–{Math.min(startIndex + pageSize, filteredExams.length)}
                </span>{" "}
                trên <span className="font-semibold">{filteredExams.length}</span> đề thi
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md border ${
                    currentPage === 1
                      ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Trước
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  const active = page === currentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md border text-xs md:text-sm ${
                        active
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md border ${
                    currentPage === totalPages
                      ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
