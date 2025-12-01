// src/pages/StudentExamResult.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import examApi from "../api/examApi";

export default function StudentExamResult() {
  const { id } = useParams(); // examId
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [err, setErr] = useState("");

  // ==== STATE CHO GIẢI THÍCH AI ====
  // lưu kết quả giải thích theo từng câu (key: answerId hoặc index)
  const [aiExplainMap, setAiExplainMap] = useState({});
  const [aiLoadingMap, setAiLoadingMap] = useState({});
  const [aiErrorMap, setAiErrorMap] = useState({});
  // ==================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErr("");

        // Lấy tất cả các lần làm bài
        const attempts = await examApi.student.getMyAttempts(id);

        if (!attempts || !attempts.length) {
          setErr("Bạn chưa có lần làm nào cho bài thi này.");
          setAttempt(null);
          return;
        }

        // Backend sort attemptIndex DESC sẵn, phần tử 0 là mới nhất
        const latest = attempts[0];
        setAttempt(latest);
      } catch (e) {
        console.error(e);
        setErr(
          e?.response?.data?.message || "Không tải được kết quả bài thi."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ====== HÀM GỌI AI GIẢI THÍCH CHO 1 CÂU ======
  const handleExplainAI = async (ans, idx) => {
    const key = ans._id || idx;

    try {
      setAiErrorMap((prev) => ({ ...prev, [key]: "" }));
      setAiLoadingMap((prev) => ({ ...prev, [key]: true }));

      const q = ans.question || {};
      const type = q.type;

      // Lấy toàn bộ options (ưu tiên snapshot để khớp lúc làm bài)
      const allOptions =
        (ans.optionSnapshots && ans.optionSnapshots.length
          ? ans.optionSnapshots
          : q.options) || [];

      const payload = {
        questionId: q._id,
        questionContent: ans.questionContent || q.content || "",
        type,
        options: allOptions.map((op) => ({
          id: op.optionId || op._id,
          text: op.text,
          isCorrect: !!op.isCorrect,
        })),
        studentAnswer: {
          selectedOptionIds: ans.selectedOptionIds || [],
          answerText: ans.answerText || "",
          fileUrl: ans.fileUrl || "",
        },
        score: ans.score ?? 0,
        maxScore: ans.maxScore ?? 0,
      };

      // TODO: bạn implement hàm này trong examApi + backend
      const res = await examApi.student.explainAnswer(payload);

      // res nên trả về dạng:
      // { verdict, explanation, correctAnswerText, reasonCorrect, tip }
      setAiExplainMap((prev) => ({ ...prev, [key]: res }));
    } catch (e) {
      console.error(e);
      setAiErrorMap((prev) => ({
        ...prev,
        [key]:
          e?.response?.data?.message ||
          "Không giải thích được, vui lòng thử lại.",
      }));
    } finally {
      setAiLoadingMap((prev) => ({ ...prev, [key]: false }));
    }
  };
  // ============================================

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-sm text-slate-500">Đang tải kết quả...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-sm text-red-500 mb-3">{err}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-sm text-slate-500">Không có dữ liệu kết quả.</p>
      </div>
    );
  }

  const exam = attempt.exam || {};
  const canViewScore =
    exam.showScoreToStudent !== false && attempt.maxScore > 0;

  // quyền xem đáp án chi tiết: có bật showCorrectAnswers + không đặt never
  const now = new Date();
  const dueAt = exam.dueAt ? new Date(exam.dueAt) : null;
  const revealMode = exam.revealAnswersMode || "immediately";

  const canViewAnswers =
    exam.showCorrectAnswers === true &&
    revealMode !== "never" &&
    (revealMode !== "after_due" || (dueAt && now > dueAt));

  const percent =
    attempt.maxScore > 0
      ? Math.round((attempt.totalScore / attempt.maxScore) * 100)
      : 0;

  const totalQuestions = Array.isArray(attempt.answers)
    ? attempt.answers.length
    : 0;

  const correctQuestions = Array.isArray(attempt.answers)
    ? attempt.answers.filter(
        (a) =>
          a &&
          typeof a.score === "number" &&
          typeof a.maxScore === "number" &&
          a.maxScore > 0 &&
          a.score >= a.maxScore
      ).length
    : 0;

  const score10 =
    attempt.maxScore > 0
      ? ((attempt.totalScore / attempt.maxScore) * 10).toFixed(2)
      : "0.00";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl border shadow-soft p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">
              📝 {exam.title || "Bài kiểm tra"}
            </h1>
            <p className="text-sm text-slate-500">
              Lần làm:{" "}
              <span className="font-semibold">
                {attempt.attemptIndex || 1}
              </span>{" "}
              · Trạng thái:{" "}
              <span className="font-semibold">
                {attempt.status === "graded"
                  ? "Đã chấm"
                  : attempt.status === "submitted"
                  ? "Đã nộp"
                  : attempt.status === "timeout"
                  ? "Hết giờ"
                  : "Không rõ"}
              </span>
            </p>
          </div>

          <div className="text-right space-y-1">
            {canViewScore && (
              <>
                <div className="text-xs text-slate-500">Điểm tổng</div>
                <div className="text-xl font-bold text-orange-600">
                  {attempt.totalScore}
                  <span className="text-sm text-slate-500">
                    {" "}
                    / {attempt.maxScore} ({percent}%)
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Điểm quy đổi thang 10:{" "}
                  <span className="font-semibold">{score10}/10</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tóm tắt số câu đúng / sai */}
        {canViewScore && (
          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
              Đúng: {correctQuestions}/{totalQuestions} câu
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600">
              Tổng số câu: {totalQuestions}
            </span>
          </div>
        )}

        {/* Nếu không cho xem điểm chi tiết */}
        {!canViewScore && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded text-sm">
            Giáo viên chưa cho phép xem điểm / chi tiết bài làm. Điểm sẽ được
            cập nhật sau.
          </div>
        )}

        {/* Danh sách câu hỏi */}
        {canViewScore && (
          <div className="mt-4 space-y-4">
            {attempt.answers.map((ans, idx) => {
              const q = ans.question || {};
              const type = q.type;
              const isCorrect =
                typeof ans.score === "number" &&
                typeof ans.maxScore === "number" &&
                ans.maxScore > 0 &&
                ans.score >= ans.maxScore;

              const key = ans._id || idx;
              const aiExplain = aiExplainMap[key];
              const aiLoading = aiLoadingMap[key];
              const aiErr = aiErrorMap[key];

              // text câu trả lời của học viên
              let studentAnswerText = "";
              if (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
                const selectedIds = ans.selectedOptionIds.map(String);
                const allOptions =
                  ans.optionSnapshots && ans.optionSnapshots.length
                    ? ans.optionSnapshots
                    : q.options || [];

                studentAnswerText = allOptions
                  .filter((op) =>
                    selectedIds.includes(String(op.optionId || op._id))
                  )
                  .map((op) => op.text)
                  .join("; ");
              } else if (ans.answerText) {
                studentAnswerText = ans.answerText;
              }

              // chuẩn bị đáp án đúng nếu được phép xem
              let correctAnswerText = "";
              if (canViewAnswers) {
                if (type === "multiple_choice") {
                  const correctOptions = (q.options || []).filter(
                    (op) => op.isCorrect
                  );
                  correctAnswerText = correctOptions
                    .map((op) => op.text)
                    .join("; ");
                } else if (
                  type === "true_false" ||
                  type === "short_answer"
                ) {
                  correctAnswerText = q.correctAnswer || "";
                } else {
                  correctAnswerText = "";
                }
              }

              const canExplainByAI = [
                "multiple_choice",
                "true_false",
                "short_answer",
                "essay",
              ].includes(type);

              return (
                <div
                  key={key}
                  className="border border-slate-100 rounded-lg p-3 bg-slate-50/60"
                >
                  <div className="flex justify-between items-start gap-3 mb-1">
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 mb-1">
                        Câu {idx + 1} ·{" "}
                        {type === "multiple_choice"
                          ? "Trắc nghiệm"
                          : type === "true_false"
                          ? "Đúng / Sai"
                          : type === "short_answer"
                          ? "Tự luận ngắn"
                          : type === "essay"
                          ? "Bài luận"
                          : type === "file_upload"
                          ? "Nộp file"
                          : "Khác"}
                      </div>
                      <div className="text-sm text-slate-900 mb-1">
                        {ans.questionContent || q.content}
                      </div>
                    </div>
                    <div className="text-right shrink-0 w-28">
                      <div
                        className={
                          "text-xs font-semibold " +
                          (isCorrect ? "text-emerald-600" : "text-red-500")
                        }
                      >
                        {isCorrect ? "Đúng" : "Sai"}
                      </div>
                      <div className="text-xs text-slate-500">
                        Điểm: {ans.score ?? 0}/{ans.maxScore ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Hiển thị đáp án học viên */}
                  <div className="text-xs text-slate-700 mb-1">
                    <span className="font-semibold">Bạn trả lời:</span>{" "}
                    {studentAnswerText || "(Không trả lời)"}
                  </div>

                  {/* File đã nộp (nếu có) */}
                  {ans.fileUrl && (
                    <div className="text-xs text-slate-700 mb-1">
                      File nộp:{" "}
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

                  {/* Đáp án đúng (nếu giáo viên cho xem) */}
                  {canViewAnswers && correctAnswerText && (
                    <div className="text-xs text-emerald-700 mt-1">
                      <span className="font-semibold">Đáp án đúng:</span>{" "}
                      {correctAnswerText}
                    </div>
                  )}

                  {/* Nút GIẢI THÍCH AI */}
                  {canExplainByAI && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleExplainAI(ans, idx)}
                        disabled={aiLoading}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {aiLoading ? "AI đang phân tích..." : "Giải thích bằng AI"}
                      </button>
                      {aiExplain && (
                        <span className="text-[11px] text-slate-400">
                          Đã có giải thích AI
                        </span>
                      )}
                    </div>
                  )}

                  {/* Lỗi AI (nếu có) */}
                  {aiErr && (
                    <div className="mt-2 text-[11px] text-red-500">
                      {aiErr}
                    </div>
                  )}

                  {/* Kết quả giải thích AI */}
                  {aiExplain && (
                    <div className="mt-3 p-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 space-y-1">
                      {aiExplain.verdict && (
                        <div>
                          <span className="font-semibold">Kết luận:</span>{" "}
                          {aiExplain.verdict}
                        </div>
                      )}
                      {aiExplain.explanation && (
                        <div>
                          <span className="font-semibold">Giải thích:</span>{" "}
                          {aiExplain.explanation}
                        </div>
                      )}
                      {aiExplain.correctAnswerText && (
                        <div>
                          <span className="font-semibold">
                            Đáp án đúng theo AI:
                          </span>{" "}
                          {aiExplain.correctAnswerText}
                        </div>
                      )}
                      {aiExplain.reasonCorrect && (
                        <div>
                          <span className="font-semibold">Vì sao đúng:</span>{" "}
                          {aiExplain.reasonCorrect}
                        </div>
                      )}
                      {aiExplain.tip && (
                        <div>
                          <span className="font-semibold">Gợi ý cải thiện:</span>{" "}
                          {aiExplain.tip}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Nút điều hướng */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
          >
            ← Quay lại
          </button>
          <button
            onClick={() => navigate("/my-courses")}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
          >
            Về khoá học của tôi
          </button>
        </div>
      </div>
    </div>
  );
}
