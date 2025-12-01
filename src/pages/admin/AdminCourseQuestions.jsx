// src/pages/admin/AdminCourseQuestions.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, MessageCircle, Send } from "lucide-react";
import Swal from "sweetalert2";
import {
  getCourseQuestions,
  answerCourseQuestion,
} from "../../api/adminCourseApi";

export default function AdminCourseQuestions() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [answeringId, setAnsweringId] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  /* ============================
   *  Lấy danh sách câu hỏi
   * ============================ */
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await getCourseQuestions(courseId);

      // Chuẩn hoá mọi dạng trả về từ backend
      const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.questions)
        ? res.data.questions
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      const list = rawList.map((q, idx) => {
        const id = q._id || q.id || String(idx);

        const questionText = q.content || q.question || "";
        const studentName =
          q.user?.name || q.userName || q.student?.name || "Học viên";
        const studentEmail = q.user?.email || q.student?.email || "";

        const answered = !!q.answer;

        return {
          id,
          question: questionText,
          answer: q.answer || "",
          createdAt: q.createdAt || q.created_at,
          answeredAt: q.answerAt || q.answeredAt || q.answered_at,
          student: {
            name: studentName,
            email: studentEmail,
          },
          status: answered ? "answered" : "pending",
        };
      });

      setQuestions(list);
    } catch (err) {
      console.error("Lỗi khi tải Q&A:", err);
      Swal.fire("Lỗi", "Không thể tải danh sách câu hỏi.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ============================
   *  Bắt đầu trả lời 1 câu hỏi
   * ============================ */
  const startAnswer = (q) => {
    setAnsweringId(q.id);
    setAnswerText(q.answer || "");
  };

  /* ============================
   *  Gửi câu trả lời
   * ============================ */
  const submitAnswer = async () => {
    const text = answerText.trim();
    if (!text) {
      Swal.fire("Lưu ý", "Bạn chưa nhập nội dung trả lời.", "info");
      return;
    }

    try {
      setSubmitting(true);

      await answerCourseQuestion(courseId, answeringId, {
        answer: text,
        isResolved: true,
      });

      Swal.fire("Thành công", "Đã gửi câu trả lời.", "success");

      setAnsweringId(null);
      setAnswerText("");
      fetchQuestions();
    } catch (err) {
      console.error("Lỗi khi gửi trả lời:", err);
      Swal.fire("Lỗi", "Không thể gửi câu trả lời.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ============================
   *  RENDER
   * ============================ */
  return (
    <div className="p-6 bg-orange-50 min-h-screen rounded-xl shadow-inner">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white border border-orange-200 text-orange-500 hover:bg-orange-100 transition"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-orange-600">
              💬 Q&amp;A khóa học
            </h1>
            <p className="text-sm text-gray-500">
              Giáo viên xem &amp; trả lời câu hỏi từ học viên.
            </p>
          </div>
        </div>

        <Link
          to="/admin/courses"
          className="text-sm text-orange-600 hover:underline"
        >
          ⬅ Quay lại danh sách khoá học
        </Link>
      </div>

      {/* LOADING / EMPTY / LIST */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-orange-400">
          <Loader2 className="animate-spin mr-2" />
          Đang tải danh sách câu hỏi...
        </div>
      ) : questions.length === 0 ? (
        <p className="text-center text-gray-500 italic py-10">
          Chưa có câu hỏi nào cho khóa học này.
        </p>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-xl shadow-sm border border-orange-100 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 text-orange-500">
                  <MessageCircle size={20} />
                </div>

                <div className="flex-1">
                  {/* Header của câu hỏi */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {q.student?.name || "Học viên"}
                      </p>
                      {q.student?.email && (
                        <p className="text-xs text-gray-500">
                          {q.student.email}
                        </p>
                      )}
                    </div>

                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        q.status === "answered"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {q.status === "answered" ? "Đã trả lời" : "Chưa trả lời"}
                    </span>
                  </div>

                  {/* Nội dung câu hỏi */}
                  <p className="text-sm text-gray-800 mt-2 whitespace-pre-line">
                    {q.question}
                  </p>

                  {/* Thời gian đặt câu hỏi */}
                  {q.createdAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Hỏi lúc:{" "}
                      {new Date(q.createdAt).toLocaleString("vi-VN")}
                    </p>
                  )}

                  {/* Nếu đã trả lời và không ở chế độ chỉnh sửa */}
                  {q.answer && q.id !== answeringId && (
                    <div className="mt-3 bg-orange-50 border border-orange-100 rounded-lg p-3 text-sm text-gray-700">
                      <p className="font-semibold text-orange-700">Trả lời:</p>
                      <p className="whitespace-pre-line">{q.answer}</p>
                      {q.answeredAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Trả lời lúc:{" "}
                          {new Date(q.answeredAt).toLocaleString("vi-VN")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Form trả lời */}
                  {answeringId === q.id ? (
                    <div className="mt-3">
                      <textarea
                        rows={3}
                        className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:ring-orange-200 focus:border-orange-400"
                        placeholder="Nhập câu trả lời..."
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                      />

                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAnsweringId(null);
                            setAnswerText("");
                          }}
                          className="text-xs px-3 py-1 rounded-md border border-gray-300 text-gray-600 bg-white hover:bg-gray-50"
                          disabled={submitting}
                        >
                          Hủy
                        </button>

                        <button
                          type="button"
                          onClick={submitAnswer}
                          disabled={submitting}
                          className="text-xs px-3 py-1 rounded-md bg-orange-500 text-white flex items-center gap-1 hover:bg-orange-600 disabled:opacity-60"
                        >
                          {submitting ? (
                            <>
                              <Loader2 size={14} className="animate-spin" /> Đang gửi
                            </>
                          ) : (
                            <>
                              <Send size={14} /> Gửi
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startAnswer(q)}
                      className="mt-3 text-xs px-3 py-1 rounded-md border border-sky-300 text-sky-700 bg-white hover:bg-sky-50"
                    >
                      {q.answer ? "Sửa câu trả lời" : "Trả lời"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
