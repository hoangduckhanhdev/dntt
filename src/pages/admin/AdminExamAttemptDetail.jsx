// src/pages/admin/AdminExamAttemptDetail.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import examApi from "../../api/examApi";

const API_BASE = "http://localhost:5000/api";

export default function AdminExamAttemptDetail() {
  const { id, attemptId } = useParams(); // id = examId
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // state dùng để chỉnh điểm / comment
  const [answerEdits, setAnswerEdits] = useState([]);

  // state cho AI
  const [aiLoadingQuestionId, setAiLoadingQuestionId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErr("");
      const detail = await examApi.admin.getAttemptDetail(id, attemptId);
      setAttempt(detail);
      setExam(detail.exam || null);

      const mapped =
        (detail.answers || []).map((a) => ({
          questionId: a.question?._id || a.question,
          score: a.score ?? 0,
          maxScore: a.maxScore ?? 0,
          teacherComment: a.teacherComment || "",
          type: a.question?.type,
          autoGraded: a.autoGraded,
        })) || [];
      setAnswerEdits(mapped);
    } catch (e) {
      console.error(e);
      setErr("Không tải được chi tiết bài làm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, attemptId]);

  const formatDateTime = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleString("vi-VN");
  };

  const handleScoreChange = (questionId, value) => {
    const num = value === "" ? "" : Number(value);
    setAnswerEdits((prev) =>
      prev.map((a) =>
        String(a.questionId) === String(questionId)
          ? { ...a, score: num }
          : a
      )
    );
  };

  const handleCommentChange = (questionId, value) => {
    setAnswerEdits((prev) =>
      prev.map((a) =>
        String(a.questionId) === String(questionId)
          ? { ...a, teacherComment: value }
          : a
      )
    );
  };

  const handleSaveGrades = async () => {
    try {
      setSaving(true);
      setErr("");

      const payloadAnswers = answerEdits.map((a) => ({
        question: a.questionId,
        score:
          a.score === "" || Number.isNaN(Number(a.score))
            ? 0
            : Number(a.score),
        teacherComment: a.teacherComment || "",
      }));

      await examApi.admin.gradeAttempt(id, attemptId, payloadAnswers);
      await loadData();
    } catch (e) {
      console.error(e);
      setErr("Lưu điểm thất bại.");
    } finally {
      setSaving(false);
    }
  };

  // ====== GỌI AI GỢI Ý ĐIỂM & NHẬN XÉT CHO 1 CÂU TỰ LUẬN ======
  const handleAskAIForQuestion = async (ans) => {
    if (!exam) return;

    const q = ans.question || {};
    const qId = q._id || ans.question;
    const qType = q.type || "essay";
    const maxScore = q.score || ans.maxScore || 10;

    // Lấy text câu trả lời của học viên (dùng lại logic hiển thị)
    let studentAnswerText = "";
    if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
      const optionTexts = (ans.optionSnapshots || [])
        .filter((o) =>
          ans.selectedOptionIds.map(String).includes(String(o.optionId))
        )
        .map((o) => o.text);
      studentAnswerText = optionTexts.join("; ");
    } else if (ans.answerText) {
      studentAnswerText = ans.answerText;
    }

    if (!studentAnswerText) {
      alert("Học viên chưa trả lời, AI không thể gợi ý điểm.");
      return;
    }

    try {
      setAiLoadingQuestionId(String(qId));

      // ✅ GỌI ĐÚNG ENDPOINT & BODY MATCH BACKEND
      const resp = await axios.post(
        `${API_BASE}/ai/grade-essay`,
        {
          question: ans.questionContent || q.content || "",
          studentAnswer: studentAnswerText,
          maxScore: Number(maxScore) || 10,
          language: "vi",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = resp.data || {};

      // Backend hiện trả: { score, comment }
      const scoreSuggestion =
        typeof data.score === "number" ? data.score : null;
      const commentSuggestion = data.comment || "";

      if (scoreSuggestion === null && !commentSuggestion) {
        alert("AI không trả về gợi ý hợp lệ, bạn vui lòng tự chấm.");
        return;
      }

      if (scoreSuggestion !== null) {
        handleScoreChange(qId, scoreSuggestion);
      }
      if (commentSuggestion) {
        handleCommentChange(qId, commentSuggestion);
      }
    } catch (e) {
      console.error("AI grade error:", e?.response?.data || e);
      alert("Không gọi được AI gợi ý điểm. Kiểm tra server AI / API key.");
    } finally {
      setAiLoadingQuestionId(null);
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-slate-500">Đang tải chi tiết bài làm...</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-sm text-red-500">Không tìm thấy bài làm.</p>
      </div>
    );
  }

  const totalPercent =
    attempt.maxScore && attempt.maxScore > 0
      ? Math.round((attempt.totalScore / attempt.maxScore) * 100)
      : 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Chi tiết bài làm
          </h1>
          <p className="text-sm text-slate-500">
            Học viên{" "}
            <span className="font-semibold text-slate-800">
              {attempt.student?.name || "Không rõ"}
            </span>{" "}
            · Lần {attempt.attemptIndex || 1}
          </p>
          {exam && (
            <p className="text-xs text-slate-500 mt-1">
              Đề:&nbsp;
              <span className="font-medium text-slate-800">
                {exam.title}
              </span>{" "}
              · Thời gian làm:{" "}
              {attempt.startedAt && attempt.submittedAt
                ? `${formatDateTime(attempt.startedAt)} → ${formatDateTime(
                    attempt.submittedAt
                  )}`
                : "-"}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate(`/admin/exams/${id}/attempts`)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
        >
          ← Quay lại danh sách
        </button>
      </div>

      {err && (
        <p className="text-sm text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">
          {err}
        </p>
      )}

      {/* Tổng điểm */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-3">
          <div className="text-xs text-slate-500">Điểm tổng</div>
          <div className="text-xl font-semibold text-slate-800">
            {attempt.totalScore ?? 0}
            {attempt.maxScore ? (
              <span className="text-sm text-slate-500">
                {" "}
                / {attempt.maxScore}
              </span>
            ) : null}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-3">
          <div className="text-xs text-slate-500">Tỉ lệ %</div>
          <div className="text-xl font-semibold text-slate-800">
            {totalPercent}%
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-3">
          <div className="text-xs text-slate-500">Trạng thái</div>
          <div className="text-sm font-semibold text-slate-800">
            {attempt.status === "graded"
              ? "Đã chấm"
              : attempt.status === "submitted"
              ? "Đã nộp"
              : attempt.status === "timeout"
              ? "Hết giờ"
              : "Đang làm"}
          </div>
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-soft p-4 space-y-4">
        {attempt.answers.map((ans, idx) => {
          const edit = answerEdits.find(
            (a) =>
              String(a.questionId) ===
              String(ans.question?._id || ans.question)
          );
          const qType = ans.question?.type;

          // text câu trả lời của học viên
          let studentAnswerText = "";
          if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
            const optionTexts = (ans.optionSnapshots || [])
              .filter((o) =>
                ans.selectedOptionIds
                  .map(String)
                  .includes(String(o.optionId))
              )
              .map((o) => o.text);
            studentAnswerText = optionTexts.join("; ");
          } else if (ans.answerText) {
            studentAnswerText = ans.answerText;
          }

          const qId = ans.question?._id || ans.question;
          const aiLoadingThis = aiLoadingQuestionId === String(qId);

          const isEssayLike = ["short_answer", "essay", "file_upload"].includes(
            qType
          );

          return (
            <div
              key={idx}
              className="border border-slate-100 rounded-lg p-3 bg-slate-50/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-1">
                    Câu {idx + 1} ·{" "}
                    {qType === "multiple_choice"
                      ? "Trắc nghiệm"
                      : qType === "true_false"
                      ? "Đúng / Sai"
                      : qType === "short_answer"
                      ? "Tự luận ngắn"
                      : qType === "essay"
                      ? "Bài luận"
                      : qType === "file_upload"
                      ? "Nộp file"
                      : "Khác"}
                  </div>
                  <div className="text-sm text-slate-900 mb-2">
                    {ans.questionContent || ans.question?.content}
                  </div>

                  {/* Phương án / đáp án */}
                  {ans.optionSnapshots && ans.optionSnapshots.length > 0 && (
                    <ul className="mb-2 text-sm">
                      {ans.optionSnapshots.map((opt) => {
                        const isSelected = ans.selectedOptionIds
                          .map(String)
                          .includes(String(opt.optionId));
                        // nếu backend có populated question.options để biết đáp án đúng
                        const correctIds =
                          (ans.question?.options || [])
                            .filter((o) => o.isCorrect)
                            .map((o) => String(o._id)) || [];
                        const isCorrect =
                          correctIds.length &&
                          correctIds.includes(String(opt.optionId));

                        return (
                          <li
                            key={String(opt.optionId)}
                            className={`px-2 py-1 rounded text-xs flex items-center gap-2 ${
                              isSelected
                                ? "bg-orange-50 text-orange-900"
                                : "text-slate-700"
                            }`}
                          >
                            {isSelected && (
                              <span className="text-orange-500">●</span>
                            )}
                            <span>{opt.text}</span>
                            {isCorrect && (
                              <span className="ml-1 text-[10px] text-emerald-600">
                                (Đáp án đúng)
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Câu trả lời của học viên */}
                  <div className="text-xs text-slate-600 mb-1">
                    <span className="font-semibold">Trả lời:</span>{" "}
                    {studentAnswerText || "(chưa trả lời)"}
                  </div>

                  {/* File đính kèm nếu có */}
                  {ans.fileUrl && (
                    <div className="text-xs text-slate-600 mb-1">
                      File:{" "}
                      <a
                        href={ans.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-600 underline"
                      >
                        Xem file
                      </a>
                    </div>
                  )}
                </div>

                {/* Khung chấm điểm */}
                <div className="w-40 shrink-0 border-l border-slate-100 pl-3">
                  <div className="text-xs text-slate-500 mb-1">
                    Điểm câu hỏi
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <input
                      type="number"
                      min={0}
                      className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
                      value={edit?.score ?? ans.score ?? 0}
                      onChange={(e) =>
                        handleScoreChange(
                          ans.question?._id || ans.question,
                          e.target.value
                        )
                      }
                    />
                    <span className="text-xs text-slate-500">
                      / {edit?.maxScore ?? ans.maxScore ?? 0}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mb-1">
                    Nhận xét
                  </div>
                  <textarea
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
                    value={edit?.teacherComment ?? ans.teacherComment ?? ""}
                    onChange={(e) =>
                      handleCommentChange(
                        ans.question?._id || ans.question,
                        e.target.value
                      )
                    }
                    placeholder="Nhận xét ngắn..."
                  />

                  {ans.autoGraded && (
                    <p className="text-[10px] text-emerald-600 mt-1">
                      Đã chấm tự động, bạn có thể chỉnh sửa lại nếu cần.
                    </p>
                  )}

                  {/* Nút AI cho câu tự luận */}
                  {isEssayLike && (
                    <button
                      type="button"
                      onClick={() => handleAskAIForQuestion(ans)}
                      disabled={aiLoadingThis}
                      className="mt-2 w-full px-2 py-1 rounded-lg border border-orange-300 text-[11px] text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-60"
                    >
                      {aiLoadingThis
                        ? "AI đang gợi ý..."
                        : "Gợi ý điểm & nhận xét bằng AI"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nút lưu điểm */}
      <div className="flex justify-end mt-4">
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveGrades}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu điểm & nhận xét"}
        </button>
      </div>
    </div>
  );
}
