import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import examApi from "../api/examApi";
import aiAdvisorApi from "../api/aiAdvisorApi";
import { API_URL } from "../api/config";

export default function StudentExamDo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("waiting");
  const [countdown, setCountdown] = useState(10);

  const timerRef = useRef(null);
  const startedRef = useRef(false);

  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [submittedAttempt, setSubmittedAttempt] = useState(null);

  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [dueRemainingSeconds, setDueRemainingSeconds] = useState(null);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [isOverDue, setIsOverDue] = useState(false);

  const [aiResult, setAiResult] = useState(null);
  const [resultPopup, setResultPopup] = useState(null);

  // ====== 1) Chặn vào làm bài khi chưa đăng nhập ======
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate(`/login?redirect=/exams/${id}/do`, { replace: true });
    }
  }, [id, navigate]);

  // ====== 2) Countdown chỉ chạy khi có token ======
  useEffect(() => {
    if (phase !== "waiting") return;

    const token = localStorage.getItem("token");
    if (!token) return; // đã redirect ở useEffect trên

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleStart(); // tự start
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleStart = async () => {
    if (startedRef.current) return;

    // chặn nếu chưa có token
    const token = localStorage.getItem("token");
    if (!token) {
      navigate(`/login?redirect=/exams/${id}/do`, { replace: true });
      return;
    }

    startedRef.current = true;

    try {
      const data = await examApi.student.start(id);

      setExam(data.exam);
      setAttempt(data.attempt);
      setRemainingSeconds(data.remainingSeconds ?? null);

      if (data.exam?.dueAt && new Date(data.exam.dueAt) < new Date()) {
        setIsOverDue(true);
        setDueRemainingSeconds(0);
      }

      setPhase("doing");
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      console.log("START EXAM ERROR:", status, data);

      const code = data?.code;
      const msg =
        data?.message ||
        err?.message ||
        "Không thể bắt đầu / tiếp tục bài thi";

      window.alert(code ? `${msg}\n(Mã lỗi: ${code})` : msg);

      if (status === 401) {
        navigate(`/login?redirect=/exams/${id}/do`, { replace: true });
      } else {
        // Không back ngay để user đọc lý do (NOT_PAID/NOT_REGISTERED/...)
        // Nếu bạn muốn back sau khi đọc thì bật dòng dưới:
        // navigate(-1);
        startedRef.current = false; // cho phép bấm lại sau khi xem lỗi
        setPhase("waiting");
        setCountdown(10);
      }
    }
  };

  // ====== Timer timeLimit ======
  useEffect(() => {
    if (phase !== "doing") return;
    if (remainingSeconds == null) return;
    if (remainingSeconds <= 0) return;

    const t = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [phase, remainingSeconds]);

  // ====== Timer dueAt ======
  useEffect(() => {
    if (!exam?.dueAt) return;

    const dueMs = new Date(exam.dueAt).getTime();

    const tick = () => {
      const diffSec = Math.floor((dueMs - Date.now()) / 1000);
      if (diffSec <= 0) {
        setDueRemainingSeconds(0);
        setIsOverDue(true);
      } else {
        setDueRemainingSeconds(diffSec);
      }
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [exam]);

  const updateAnswer = (questionId, payload) => {
    setAttempt((prev) => {
      if (!prev) return prev;
      const newAnswers = prev.answers.map((a) =>
        String(a.question?._id || a.question) === String(questionId)
          ? { ...a, ...payload }
          : a
      );
      return { ...prev, answers: newAnswers };
    });
  };

  // ====== 3) AutoSave debounce (giảm spam request) ======
  const autoSaveTimeoutRef = useRef(null);

  const autoSave = useCallback(
    async (answers) => {
      if (!answers || !answers.length) return;

      try {
        setSaving(true);

        const payload = answers.map((a) => ({
          question: a.question?._id || a.question,
          selectedOptionIds: a.selectedOptionIds || [],
          answerText: a.answerText || "",
          fileUrl: a.fileUrl || "",
        }));

        await examApi.student.autoSave(id, payload);
      } catch (err) {
        console.error("autosave error", err?.response?.data || err);
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (phase !== "doing") return;
    if (!attempt?.answers?.length) return;

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(attempt.answers);
    }, 1200);

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [phase, attempt?.answers, autoSave]);

  const handleOptionChange = (q, optionId, isMulti) => {
    if (!attempt) return;

    const current = attempt.answers.find(
      (a) => String(a.question?._id || a.question) === String(q._id)
    );

    let selected = current?.selectedOptionIds || [];

    if (isMulti) {
      if (selected.map(String).includes(String(optionId))) {
        selected = selected.filter((id2) => String(id2) !== String(optionId));
      } else {
        selected = [...selected, optionId];
      }
    } else {
      selected = [optionId];
    }

    updateAnswer(q._id, { selectedOptionIds: selected });
  };

  const handleTextChange = (q, value) => {
    updateAnswer(q._id, { answerText: value });
  };

  const handleFileChange = async (q, file) => {
    if (!file) return;

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("examId", id);
      formData.append("questionId", q._id);

      const res = await axios.post(`${API_URL}/uploads/exam`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      });

      const url = res.data?.url || res.data?.fileUrl;
      if (!url) {
        window.alert("Upload file không thành công, thiếu URL trả về.");
        return;
      }

      updateAnswer(q._id, { fileUrl: url });
    } catch (err) {
      console.error("Upload file thất bại:", err?.response?.data || err);

      if (err?.response?.status === 401) {
        window.alert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
        navigate(`/login?redirect=/exams/${id}/do`, { replace: true });
      } else {
        window.alert(err?.response?.data?.message || "Upload file thất bại, bạn thử lại nhé.");
      }
    }
  };

  const handleSubmit = async () => {
    if (isOverDue) {
      window.alert("Đã quá hạn nộp bài. Hệ thống không thể nhận bài.");
      return;
    }
    if (!window.confirm("Bạn chắc chắn muốn nộp bài?")) return;

    try {
      setSubmitting(true);

      const res = await examApi.student.submit(id);
      const att = res?.attempt;

      setSubmittedAttempt(att || null);
      setPhase("submitted");

      if (!exam || exam.showScoreToStudent === false || !Array.isArray(att?.answers)) {
        setResultPopup({ type: "simple" });
      } else {
        const totalQuestions = att.answers.length;
        const correctQuestions = att.answers.filter(
          (a) =>
            a &&
            typeof a.score === "number" &&
            typeof a.maxScore === "number" &&
            a.maxScore > 0 &&
            a.score >= a.maxScore
        ).length;

        const score10 =
          totalQuestions > 0
            ? ((correctQuestions / totalQuestions) * 10).toFixed(2)
            : "0.00";

        setResultPopup({
          type: "score",
          correctQuestions,
          totalQuestions,
          score10,
        });
      }

      // AI skill map
      try {
        const userRaw = localStorage.getItem("user");
        const userObj = userRaw ? JSON.parse(userRaw) : null;

        const userId = userObj?._id || userObj?.id || null;
        const courseId = exam?.course?._id || exam?.courseId || exam?.course || null;

        if (!userId || !courseId) {
          console.warn("Thiếu userId hoặc courseId, bỏ qua gọi AI Skill Map.");
          return;
        }

        if (exam.type === "entry_test") {
          const aiRes = await aiAdvisorApi.generateSkillMapFromEntryTest({
            courseId,
            userId,
            examId: exam._id || id,
            attemptId: att._id,
          });
          setAiResult({ mode: "entry_test", payload: aiRes });
        } else {
          const aiRes = await aiAdvisorApi.analyzeLearningPathAfterExam({
            courseId,
            userId,
            examId: exam._id || id,
            attemptId: att._id,
          });
          setAiResult({ mode: "exam_analysis", payload: aiRes });
        }
      } catch (aiErr) {
        console.error("AI analysis error:", aiErr?.response?.data || aiErr);
      }
    } catch (err) {
      console.error(err?.response?.data || err);
      if (err?.response?.data?.message === "Đã quá hạn nộp bài") setIsOverDue(true);
      window.alert(err?.response?.data?.message || "Nộp bài thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const renderTimeLimit = () => {
    if (remainingSeconds == null) return "Không giới hạn";
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const renderDueTime = () => {
    if (!exam?.dueAt) return "Không có hạn nộp";
    const d = new Date(exam.dueAt);
    return d.toLocaleString("vi-VN");
  };

  const renderDueCountdown = () => {
    if (!exam?.dueAt || dueRemainingSeconds == null) return "—";
    if (dueRemainingSeconds <= 0) return "Đã hết hạn";
    const h = Math.floor(dueRemainingSeconds / 3600);
    const m = Math.floor((dueRemainingSeconds % 3600) / 60);
    const s = dueRemainingSeconds % 60;
    const pad = (n) => n.toString().padStart(2, "0");
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  const dueCountdownClass =
    !exam?.dueAt || dueRemainingSeconds == null
      ? "text-xs text-gray-500"
      : dueRemainingSeconds > 0 && dueRemainingSeconds <= 300
      ? "text-xs text-red-500 font-semibold"
      : "text-xs text-gray-600";

  // ====== UI ======
  if (phase === "waiting") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-orange-50">
        <div className="bg-white border shadow-soft rounded-xl p-6 max-w-lg w-full">
          <h1 className="text-xl font-bold mb-2">Chuẩn bị làm bài</h1>
          <p className="text-sm text-gray-600 mb-4">
            Bài thi sẽ tự động bắt đầu sau{" "}
            <span className="text-orange-600 font-bold">{countdown}</span> giây.
          </p>
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Làm bài ngay
          </button>
          <p className="text-xs mt-3 text-gray-400">Hoặc chờ hệ thống tự bắt đầu…</p>
        </div>
      </div>
    );
  }

  if (phase === "doing" && (!exam || !attempt)) {
    return <div className="p-6">Đang tải đề thi...</div>;
  }

  const isTimeUp = remainingSeconds === 0;

  if (phase === "submitted") {
    const att = submittedAttempt;

    const totalQuestions = Array.isArray(att?.answers) ? att.answers.length : 0;
    const correctQuestions = Array.isArray(att?.answers)
      ? att.answers.filter(
          (a) =>
            a &&
            typeof a.score === "number" &&
            typeof a.maxScore === "number" &&
            a.maxScore > 0 &&
            a.score >= a.maxScore
        ).length
      : 0;

    const score10 =
      totalQuestions > 0 ? ((correctQuestions / totalQuestions) * 10).toFixed(2) : "0.00";
    const percent =
      totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;

    const canViewScore = exam?.showScoreToStudent !== false;

    const handleViewSkillMap = () => {
      const courseId = exam?.course?._id || exam?.courseId || exam?.course || null;
      if (!courseId || !att?._id) {
        window.alert("Thiếu dữ liệu khoá học hoặc bài làm, không mở được bản đồ kỹ năng.");
        return;
      }
      navigate("/learning/skill-report", {
        state: { courseId, exam, attempt: att, aiResult },
      });
    };

    const renderAiBox = () => {
      if (!aiResult?.payload) return null;

      if (aiResult.mode === "entry_test") {
        const ai = aiResult.payload.ai || {};
        const skillLevels = ai.skillLevels || {};
        const suggestedSkills = ai.suggestedSkills || [];
        const path = ai.recommendedPath || [];

        return (
          <div className="mt-6 text-left bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h2 className="font-semibold text-orange-700 mb-2">
              🎯 Phân tích đầu vào & bản đồ kỹ năng gợi ý
            </h2>

            {Object.keys(skillLevels).length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Mức độ hiện tại theo từng kỹ năng:
                </p>
                <ul className="text-xs text-gray-700 list-disc pl-5 space-y-1">
                  {Object.entries(skillLevels).map(([name, level]) => (
                    <li key={name}>
                      <span className="font-semibold">{name}:</span>{" "}
                      <span>{level}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {path.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Lộ trình nên học (thứ tự gợi ý):
                </p>
                <ol className="text-xs text-gray-700 list-decimal pl-5 space-y-1">
                  {path.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ol>
              </div>
            )}

            {suggestedSkills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Kỹ năng nên tập trung:
                </p>
                <p className="text-xs text-gray-700">{suggestedSkills.join(", ")}</p>
              </div>
            )}
          </div>
        );
      }

      if (aiResult.mode === "exam_analysis") {
        const ai = aiResult.payload.ai || {};
        const weakSkills = ai.weakSkills || [];
        const shouldReview = ai.shouldReview || [];
        const recs = ai.recommendations || [];

        return (
          <div className="mt-6 text-left bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h2 className="font-semibold text-blue-700 mb-2">
              📚 Gợi ý học tập sau bài kiểm tra
            </h2>

            {weakSkills.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Kỹ năng còn yếu:
                </p>
                <p className="text-xs text-gray-700">{weakSkills.join(", ")}</p>
              </div>
            )}

            {shouldReview.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  Nên ôn / học lại:
                </p>
                <ul className="text-xs text-gray-700 list-disc pl-5">
                  {shouldReview.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {recs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Gợi ý chi tiết:</p>
                <ul className="text-xs text-gray-700 list-disc pl-5 space-y-1">
                  {recs.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      return null;
    };

    return (
      <>
        <div className="max-w-xl mx-auto p-6">
          <div className="bg-white rounded-xl border shadow-soft p-6 text-center">
            <h1 className="text-2xl font-bold mb-2 text-slate-800">
              📝 {exam?.title || "Bài kiểm tra"}
            </h1>

            {canViewScore ? (
              <>
                <p className="text-sm text-slate-600 mb-4">
                  Bạn đã nộp bài thành công. Dưới đây là kết quả:
                </p>
                <div className="mb-2">
                  <div className="text-4xl font-extrabold text-orange-600">
                    {correctQuestions}/{totalQuestions}
                  </div>
                  <div className="text-sm text-slate-500">
                    ({percent}% đúng) • Điểm quy đổi:{" "}
                    <b className="text-orange-600">{score10}/10</b>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Các câu trắc nghiệm đã được chấm tự động. Những câu tự luận / nộp file (nếu có)
                  sẽ được giáo viên chấm thêm, điểm có thể thay đổi.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-4">Bạn đã nộp bài thành công.</p>
                <p className="text-xs text-slate-500">Điểm sẽ được giáo viên chấm và cập nhật sau.</p>
              </>
            )}

            {renderAiBox()}

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={handleViewSkillMap}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600"
              >
                Xem bản đồ kỹ năng chi tiết
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

        {resultPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
                <span className="text-3xl">🎉</span>
              </div>

              <h2 className="text-lg font-bold text-slate-800 mb-1">Nộp bài thành công!</h2>

              {resultPopup.type === "score" ? (
                <>
                  <p className="text-sm text-slate-600 mb-3">
                    Bạn làm đúng{" "}
                    <span className="font-semibold text-emerald-600">
                      {resultPopup.correctQuestions}/{resultPopup.totalQuestions}
                    </span>{" "}
                    câu.
                  </p>
                  <div className="text-4xl font-extrabold text-orange-500 mb-1">
                    {resultPopup.score10}/10
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Một số câu tự luận hoặc nộp file có thể được giáo viên chấm thêm sau.
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-600 mb-4">
                  Điểm sẽ được giáo viên chấm và cập nhật sau.
                </p>
              )}

              <button
                onClick={() => setResultPopup(null)}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
              >
                OK, mình hiểu rồi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ====== Doing UI ======
  const isTimeUpNow = remainingSeconds === 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl border shadow-soft p-6">
        <div className="flex justify-between mb-4 gap-4">
          <div>
            <h1 className="text-xl font-bold">
              📝 {exam.title}{" "}
              {exam.type === "assignment" && (
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  Bài tập / nộp file
                </span>
              )}
              {exam.type === "entry_test" && (
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                  Test đầu vào (AI phân tích lộ trình)
                </span>
              )}
            </h1>

            <p className="text-sm text-gray-500">
              ⏳ Hạn nộp: <b>{renderDueTime()}</b>
            </p>

            <p className={dueCountdownClass}>
              ⌛ Thời gian tới hạn nộp: <b>{renderDueCountdown()}</b>
            </p>
          </div>

          <div className="text-right">
            <div className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm">
              ⏱ Thời gian làm bài: {renderTimeLimit()}
            </div>
            <div className="text-xs text-gray-400">{saving ? "Đang lưu..." : "Đã lưu"}</div>
          </div>
        </div>

        {isOverDue && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
            ❌ Đã quá thời hạn nộp bài. Bạn không thể tiếp tục hoặc nộp bài nữa.
          </div>
        )}

        {!isOverDue &&
          exam?.dueAt &&
          dueRemainingSeconds != null &&
          dueRemainingSeconds > 0 &&
          dueRemainingSeconds <= 300 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded text-sm">
              ⏰ Chỉ còn chưa đầy 5 phút trước hạn nộp bài. Hãy rà soát và nộp bài sớm để tránh quá hạn.
            </div>
          )}

        {isTimeUpNow && (
          <div className="p-3 bg-red-50 text-red-600 rounded mb-4 text-sm">
            Thời gian làm bài đã hết. Nếu bạn chưa kịp nộp, hệ thống có thể tự chấm dựa trên câu trả lời đã lưu.
          </div>
        )}

        <div className="space-y-5">
          {attempt.answers.map((ans, idx) => {
            const q = ans.question;
            const type = q.type;
            const selectedIds = (ans.selectedOptionIds || []).map(String);
            const optionSnapshots = ans.optionSnapshots || q.options || [];

            return (
              <div key={q._id} className="p-4 border rounded-lg bg-orange-50">
                <div className="font-bold mb-2">
                  Câu {idx + 1}: <span className="font-normal">{q.content}</span>
                </div>

                {type === "multiple_choice" &&
                  optionSnapshots.map((op) => (
                    <label
                      key={op._id || op.optionId}
                      className="flex gap-2 items-center bg-white p-2 rounded mb-2"
                    >
                      <input
                        type="checkbox"
                        disabled={isOverDue || isTimeUpNow}
                        checked={selectedIds.includes(String(op._id || op.optionId))}
                        onChange={() => handleOptionChange(q, op._id || op.optionId, true)}
                      />
                      <span>{op.text}</span>
                    </label>
                  ))}

                {type === "true_false" && (
                  <div className="flex gap-2">
                    {["true", "false"].map((v) => (
                      <button
                        key={v}
                        disabled={isOverDue || isTimeUpNow}
                        onClick={() => handleTextChange(q, v)}
                        className={`px-3 py-2 border rounded ${
                          ans.answerText === v ? "bg-orange-500 text-white" : "bg-white"
                        }`}
                      >
                        {v === "true" ? "Đúng" : "Sai"}
                      </button>
                    ))}
                  </div>
                )}

                {(type === "short_answer" || type === "essay") && (
                  <>
                    <textarea
                      rows={type === "essay" ? 4 : 2}
                      disabled={isOverDue || isTimeUpNow}
                      className="w-full p-2 border rounded"
                      value={ans.answerText || ""}
                      onChange={(e) => handleTextChange(q, e.target.value)}
                      placeholder="Nhập câu trả lời của bạn..."
                    />

                    {exam.type === "assignment" && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">
                          Hoặc nộp file (PDF, DOC, hình ảnh...) cho câu này:
                        </p>
                        <input
                          type="file"
                          disabled={isOverDue || isTimeUpNow}
                          onChange={(e) => handleFileChange(q, e.target.files?.[0])}
                          className="text-xs"
                        />
                        {ans.fileUrl && (
                          <p className="mt-1 text-xs">
                            File đã nộp:{" "}
                            <a
                              href={ans.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-orange-600 underline"
                            >
                              Xem / tải xuống
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={handleSubmit}
            disabled={submitting || isTimeUpNow || isOverDue}
            className="px-6 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
          >
            {isOverDue ? "Đã quá hạn" : submitting ? "Đang nộp..." : isTimeUpNow ? "Hết thời gian" : "Nộp bài"}
          </button>
        </div>
      </div>
    </div>
  );
}
