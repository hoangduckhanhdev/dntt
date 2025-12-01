// src/pages/admin/AdminExamAttempts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import examApi from "../../api/examApi";

export default function AdminExamAttempts() {
  const { id } = useParams(); // examId
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErr("");

        const [examRes, attemptsRes] = await Promise.all([
          examApi.admin.getExam(id),
          examApi.admin.getExamAttempts(id),
        ]);

        setExam(examRes);
        setAttempts(Array.isArray(attemptsRes) ? attemptsRes : attemptsRes.items || []);
      } catch (e) {
        console.error(e);
        setErr("Không tải được thông tin đề thi / bài làm.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const filteredAttempts = useMemo(() => {
    return attempts.filter((a) => {
      if (statusFilter === "all") return true;
      return a.status === statusFilter;
    });
  }, [attempts, statusFilter]);

  const stats = useMemo(() => {
    if (!attempts.length) return { count: 0, students: 0, avgPercent: 0 };
    const studentSet = new Set(attempts.map((a) => a.student?._id || a.student));
    let sumPercent = 0;
    attempts.forEach((a) => {
      if (a.maxScore && a.maxScore > 0) {
        sumPercent += (a.totalScore / a.maxScore) * 100;
      }
    });
    return {
      count: attempts.length,
      students: studentSet.size,
      avgPercent: Math.round(sumPercent / attempts.length) || 0,
    };
  }, [attempts]);

  const formatDateTime = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleString("vi-VN");
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Kết quả làm bài
          </h1>
          {exam && (
            <p className="text-sm text-slate-500">
              Đề:&nbsp;
              <span className="font-semibold text-slate-800">
                {exam.title}
              </span>{" "}
              · Khoá học:{" "}
              <span className="text-slate-700">
                {exam.course?.title || "Đang cập nhật"}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={() => navigate(`/admin/exams/${id}/edit`)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
        >
          ✏️ Sửa cấu hình đề
        </button>
      </div>

      {/* Thông tin nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-3">
          <div className="text-xs text-slate-500">Tổng số bài làm</div>
          <div className="text-xl font-semibold text-slate-800">
            {stats.count}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-3">
          <div className="text-xs text-slate-500">Số học viên</div>
          <div className="text-xl font-semibold text-slate-800">
            {stats.students}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-3">
          <div className="text-xs text-slate-500">Điểm trung bình</div>
          <div className="text-xl font-semibold text-slate-800">
            {stats.avgPercent}%
          </div>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Lọc theo trạng thái:</span>
          <select
            className="border border-slate-200 rounded-lg px-2 py-1 text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="submitted">Đã nộp</option>
            <option value="graded">Đã chấm</option>
            <option value="timeout">Hết giờ</option>
            <option value="in_progress">Đang làm</option>
          </select>
        </div>
      </div>

      {/* Danh sách bài làm */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
        {loading ? (
          <p className="px-4 py-6 text-sm text-slate-500">
            Đang tải dữ liệu...
          </p>
        ) : filteredAttempts.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">
            Chưa có bài làm nào cho đề này.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Học viên</th>
                  <th className="px-3 py-2 text-left">Lần</th>
                  <th className="px-3 py-2 text-left">Điểm</th>
                  <th className="px-3 py-2 text-left">Trạng thái</th>
                  <th className="px-3 py-2 text-left">Loại bài</th>
                  <th className="px-3 py-2 text-left">Nộp lúc</th>
                  <th className="px-3 py-2 text-left">Chấm lúc</th>
                  <th className="px-3 py-2 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map((a, idx) => {
                  const percent =
                    a.maxScore && a.maxScore > 0
                      ? Math.round((a.totalScore / a.maxScore) * 100)
                      : 0;

                  const statusLabel =
                    a.status === "graded"
                      ? "Đã chấm"
                      : a.status === "submitted"
                      ? "Đã nộp"
                      : a.status === "timeout"
                      ? "Hết giờ"
                      : "Đang làm";

                  const statusColor =
                    a.status === "graded"
                      ? "bg-emerald-50 text-emerald-700"
                      : a.status === "timeout"
                      ? "bg-rose-50 text-rose-700"
                      : a.status === "submitted"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-50 text-slate-600";

                  const hasFile = a.answers?.some((ans) => ans.fileUrl);
                  const hasEssay = a.answers?.some(
                    (ans) => ans.question?.type === "essay" || ans.question?.type === "short_answer"
                  );

                  const typeLabel = hasFile
                    ? "Nộp file"
                    : hasEssay
                    ? "Tự luận"
                    : "Trắc nghiệm";

                  return (
                    <tr
                      key={a._id}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">
                          {a.student?.name || "Không rõ"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {a.student?.email}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700">
                        Lần {a.attemptIndex || 1}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span className="font-semibold text-slate-800">
                          {a.totalScore ?? 0}
                        </span>
                        {a.maxScore ? (
                          <>
                            <span className="text-slate-400">
                              {" "}
                              / {a.maxScore}
                            </span>
                            <span className="ml-1 text-slate-500">
                              ({percent}%)
                            </span>
                          </>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-[11px] ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-xs text-slate-700">
                        {typeLabel}
                      </td>

                      <td className="px-3 py-2 text-xs text-slate-600">
                        {formatDateTime(a.submittedAt)}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {formatDateTime(a.gradedAt)}
                      </td>

                      <td className="px-3 py-2 text-right">
                        <Link
                          to={`/admin/exams/${id}/attempts/${a._id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500 text-white hover:bg-orange-600"
                        >
                          Xem / chấm
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
