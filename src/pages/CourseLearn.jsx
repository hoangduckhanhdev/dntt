import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AiFillStar } from "react-icons/ai";
import {
  FiChevronDown,
  FiPlay,
  FiLock,
  FiSend,
  FiMessageCircle,
  FiCheckCircle,
  FiFileText,
  FiZap,
} from "react-icons/fi";
import { FaUsers } from "react-icons/fa";
import { API_BASE } from "../api/config";

/* ===================== YouTube helpers ===================== */
const extractYouTubeId = (input = "") => {
  if (!input) return "";
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^m\./, "");
    if (host.includes("youtu.be")) return url.pathname.split("/").filter(Boolean)[0] || "";
    const v = url.searchParams.get("v");
    if (v) return v;
    const m = url.pathname.match(/\/(embed|shorts|live|v)\/([^/?#]+)/i);
    if (m?.[2]) return m[2];
    return "";
  } catch {
    return (input || "").split(/[?#&]/)[0];
  }
};

const toYouTubeEmbed = (input = "") => {
  const raw = extractYouTubeId(input);
  const id = (raw || "").replace(/[^a-zA-Z0-9_-]/g, "");
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
};

const toYouTubeWatch = (input = "") => {
  const raw = extractYouTubeId(input);
  const id = (raw || "").replace(/[^a-zA-Z0-9_-]/g, "");
  return id ? `https://www.youtube.com/watch?v=${id}` : "";
};

/* ===================== Robust lesson type ===================== */
/**
 * Ưu tiên TEXT nếu có nội dung text (textContent/content/...)
 * Chỉ coi VIDEO nếu không có text và có video
 */
const inferLessonType = (ls) => {
  const rawType = (ls?.type ?? "").toString().trim().toLowerCase();

  // Có thể backend đang trả dạng: "Bài đọc (Text)" / "Bai doc (Text)" / "TEXT"
  const isTextByType =
    rawType === "text" ||
    rawType.includes("text") ||
    rawType.includes("bài đọc") ||
    rawType.includes("bai doc") ||
    rawType.includes("reading") ||
    rawType.includes("read");

  const isVideoByType = rawType === "video" || rawType.includes("video");

  const text =
    ls?.textContent ??
    ls?.content ??
    ls?.text ??
    ls?.body ??
    ls?.description ??
    "";

  const hasText = String(text || "").trim().length > 0;
  const hasVideo = String(ls?.video || "").trim().length > 0;

  // ✅ ƯU TIÊN TEXT nếu có text content
  if (hasText) return "text";

  // Nếu type nói text nhưng chưa có textContent -> vẫn coi là text (để UI đúng)
  if (isTextByType) return "text";

  // Nếu type nói video hoặc có video -> video
  if (isVideoByType) return "video";
  if (hasVideo) return "video";

  // fallback
  return "video";
};

const normalizeApiSections = (sections = []) => {
  if (!Array.isArray(sections)) return [];
  return sections.map((sec, i) => ({
    ...sec,
    title: sec?.title || sec?.name || `Chương ${i + 1}`,
    lessons: Array.isArray(sec?.lessons)
      ? sec.lessons.map((ls, j) => {
          const __text =
            ls?.textContent ??
            ls?.content ??
            ls?.text ??
            ls?.body ??
            ls?.description ??
            "";
          const __type = inferLessonType(ls);
          return {
            ...ls,
            _id: ls?._id || ls?.id || `${i}-${j}`,
            title: ls?.title || ls?.name || `Bài ${j + 1}`,
            duration: ls?.duration || "",
            video: ls?.video || "",
            textContent: ls?.textContent || ls?.content || "",
            __type,
            __text,
            // lock fields giữ nguyên
            isLocked:
              typeof ls?.isLocked === "boolean"
                ? ls.isLocked
                : typeof ls?.locked === "boolean"
                ? ls.locked
                : typeof ls?.canWatch === "boolean"
                ? !ls.canWatch
                : false,
            isCompleted: !!ls?.isCompleted,
          };
        })
      : [],
  }));
};

/* ===================== Course image ===================== */
const resolveCourseImage = (course = {}) => {
  let img =
    course.image ||
    course.thumbnail ||
    course.courseImage ||
    (course.course && (course.course.image || course.course.thumbnail));
  if (img && !img.startsWith("http")) {
    img = `${API_BASE}${img.startsWith("/") ? "" : "/"}${img}`;
  }
  return img;
};

const Stars = ({ value = 0, size = 18, className = "" }) => {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div className={`flex items-center ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <AiFillStar
          key={i}
          size={size}
          className={i < Math.round(v) ? "text-yellow-400" : "text-gray-300"}
        />
      ))}
      <span className="ml-2 text-sm text-slate-600">{v.toFixed(1)}</span>
    </div>
  );
};

const getExamDoPath = (info) => {
  const eid = info?.examId || info?._id || info?.id;
  return eid ? `/exams/${eid}/do` : "";
};

const getExamResultPath = (info) => {
  const eid = info?.examId || info?._id || info?.id;
  return eid ? `/exams/${eid}/result` : "";
};

/* ===================== Component ===================== */
export default function CourseLearn() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessonSections, setLessonSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [progress, setProgress] = useState(0);

  const [questions, setQuestions] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [answerDrafts, setAnswerDrafts] = useState({});

  const [homeworkList, setHomeworkList] = useState([]);
  const [examList, setExamList] = useState([]);

  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [activeLesson, setActiveLesson] = useState(null);

  /* ===================== Fetch ===================== */
  const fetchCourse = async () => {
    try {
      setErr("");
      const res = await axios.get(`${API_BASE}/api/courses/${id}`);
      setCourse(res.data);
    } catch (e) {
      console.error(e);
      setErr("Không tải được thông tin khoá học.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${API_BASE}/api/progress/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProgress(Number(res.data.progress?.percent || 0));
    } catch (e) {
      console.log("Không lấy được tiến độ:", e?.response?.data || e.message);
    }
  };

  const fetchQuestions = async () => {
    try {
      setQaLoading(true);
      setQaError("");
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/courses/${id}/questions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const list = Array.isArray(res.data?.questions)
        ? res.data.questions
        : Array.isArray(res.data)
        ? res.data
        : [];
      setQuestions(list);
    } catch (e) {
      console.log("Không tải được Q&A:", e?.response?.data || e.message);
      setQaError("Không tải được danh sách câu hỏi.");
    } finally {
      setQaLoading(false);
    }
  };

  // ✅ Quan trọng: chuẩn hoá type/text trước khi set state
  const fetchLockedLessons = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_BASE}/api/courses/${id}/lessons`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(res.data?.sections)) {
        const normalized = normalizeApiSections(res.data.sections);
        setLessonSections(normalized);
        setProgress(Number(res.data.percent || 0));
      }
    } catch (e) {
      console.error("Không lấy được danh sách bài học:", e);
    }
  };

  const fetchHomeworkAndExam = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const [hwRes, examRes] = await Promise.all([
        axios.get(`${API_BASE}/api/courses/${id}/homework`, { headers }),
        axios.get(`${API_BASE}/api/courses/${id}/exam`, { headers }),
      ]);
      setHomeworkList(hwRes.data?.items || []);
      setExamList(examRes.data?.items || []);
    } catch (e) {
      console.log("Không lấy được bài tập/quiz:", e?.response?.data || e.message);
      setHomeworkList([]);
      setExamList([]);
    }
  };

  /* ===================== Local user + AI history ===================== */
  useEffect(() => {
    const raw =
      localStorage.getItem("userInfo") ||
      localStorage.getItem("user") ||
      localStorage.getItem("userData");
    if (!raw) return;
    try {
      setCurrentUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!id) return;
    const key = `aiMessages_${id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setAiMessages(parsed);
    } catch {}
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const key = `aiMessages_${id}`;
    if (aiMessages?.length) localStorage.setItem(key, JSON.stringify(aiMessages));
    else localStorage.removeItem(key);
  }, [aiMessages, id]);

  /* ===================== Init load ===================== */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setActiveLesson(null);

    fetchCourse();
    fetchProgress();
    fetchLockedLessons();
    fetchQuestions();
    fetchHomeworkAndExam();

    window.scrollTo(0, 0);
    setAiInput("");
    setAiError("");
    setAiLoading(false);
  }, [id]);

  /* ===================== Memo ===================== */
  const sections = useMemo(() => lessonSections || [], [lessonSections]);

  const title = course?.title || "Khoá học của bạn";
  const teacherName =
    course?.teacher?.name || (typeof course?.teacher === "string" ? course.teacher : "Chưa có");
  const ratingValue = Number(course?.rating ?? 0);

  const demoUrlRaw =
    course?.demoVideo ||
    course?.videoDemo ||
    course?.introVideo ||
    (sections?.[0]?.lessons?.[0]?.video || "");

  const courseImage = useMemo(() => resolveCourseImage(course || {}), [course]);

  const totalLessons = useMemo(() => {
    return sections.reduce((sum, s) => sum + (Array.isArray(s.lessons) ? s.lessons.length : 0), 0);
  }, [sections]);

  const canAnswerQuestions = useMemo(() => {
    if (!currentUser) return false;
    const role = currentUser.role;
    const isAdmin = role === "admin";
    const isTeacher = role === "teacher" || role === "instructor" || role === "giangvien";
    if (isAdmin) return true;

    const teacherId = course?.teacher?._id?.toString();
    const userId =
      currentUser._id?.toString() || currentUser.id?.toString() || currentUser.userId?.toString();

    if (isTeacher && teacherId && userId) return teacherId === userId;
    return isTeacher;
  }, [currentUser, course]);

  /* ===================== Actions ===================== */
  const updateProgress = async (percent) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const safe = Math.max(0, Math.min(100, Math.round(percent)));
      setProgress(safe);
      await axios.post(
        `${API_BASE}/api/progress/${id}`,
        { percent: safe },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      console.log("Không cập nhật được tiến độ:", e?.response?.data || e.message);
    }
  };

  const handleStartLesson = async (secIndex, lessonIndex, ls) => {
    const locked =
      typeof ls.isLocked === "boolean"
        ? ls.isLocked
        : typeof ls.locked === "boolean"
        ? ls.locked
        : typeof ls.canWatch === "boolean"
        ? !ls.canWatch
        : false;
    if (locked) return;

    const lessonId = ls._id || ls.id || `${secIndex}-${lessonIndex}`;
    const type = ls.__type || inferLessonType(ls);

    setActiveLesson({
      type,
      title: ls.title,
      video: ls.video || "",
      textContent: ls.__text || ls.textContent || ls.content || "",
      lessonId,
    });

    // progress theo index
    if (totalLessons > 0) {
      const lessonsBefore = sections
        .slice(0, secIndex)
        .reduce((sum, s) => sum + (Array.isArray(s.lessons) ? s.lessons.length : 0), 0);
      const currentIndex = lessonsBefore + lessonIndex;
      const percent = ((currentIndex + 1) / totalLessons) * 100;
      updateProgress(percent);
    }

    // video: complete + open youtube
    if (type === "video") {
      if (!ls.isCompleted) {
        const token = localStorage.getItem("token");
        if (token && lessonId) {
          try {
            await axios.post(
              `${API_BASE}/api/courses/${id}/lessons/${lessonId}/complete`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchLockedLessons();
          } catch (e) {
            console.error("Không đánh dấu hoàn thành video:", e);
          }
        }
      }
      const url = toYouTubeWatch(ls.video || "");
      if (url) window.open(url, "_blank", "noopener");
    }
  };

  const handleCompleteTextLesson = async () => {
    const token = localStorage.getItem("token");
    if (!token || !activeLesson?.lessonId) return;

    try {
      await axios.post(
        `${API_BASE}/api/courses/${id}/lessons/${activeLesson.lessonId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchLockedLessons();
    } catch (e) {
      console.error("Không đánh dấu hoàn thành bài đọc:", e);
      alert("Không thể đánh dấu hoàn thành. Thử lại nhé.");
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    const content = newQuestion.trim();
    if (!content) return;

    const token = localStorage.getItem("token");
    if (!token) return alert("Vui lòng đăng nhập để đặt câu hỏi.");

    try {
      const res = await axios.post(
        `${API_BASE}/api/courses/${id}/questions`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const created = res.data?.question || null;
      if (created) setQuestions((prev) => [created, ...prev]);
      else fetchQuestions();
      setNewQuestion("");
    } catch (e2) {
      console.error("Không gửi được câu hỏi:", e2?.response?.data || e2);
      alert("Không gửi được câu hỏi, bạn thử lại nhé.");
    }
  };

  const handleSubmitAnswer = async (questionId) => {
    const answer = (answerDrafts[questionId] || "").trim();
    if (!answer) return;

    const token = localStorage.getItem("token");
    if (!token) return alert("Vui lòng đăng nhập lại.");

    try {
      const res = await axios.patch(
        `${API_BASE}/api/courses/${id}/questions/${questionId}/answer`,
        { answer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data?.question || res.data;
      setQuestions((prev) => prev.map((q) => (q._id === updated._id ? updated : q)));
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
    } catch (e) {
      console.error("Không gửi được trả lời:", e?.response?.data || e);
      alert("Không gửi được trả lời, bạn thử lại nhé.");
    }
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    const content = aiInput.trim();
    if (!content) return;

    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const newUserMsg = { role: "user", content };
    const baseContext = [
      {
        role: "user",
        content: `Mình đang học khoá "${title}". Hãy trả lời ngắn gọn, dễ hiểu, tập trung hỗ trợ mình học tốt khoá này.`,
      },
    ];

    const messages = [...baseContext, ...(aiMessages || []), newUserMsg];

    setAiMessages((prev) => [...prev, newUserMsg]);
    setAiInput("");
    setAiLoading(true);
    setAiError("");

    try {
      const res = await axios.post(`${API_BASE}/api/ai/chat`, { messages }, { headers });
      const text = res.data?.text || "Xin lỗi, hiện trợ lý AI chưa trả lời được.";
      const botMsg = { role: "assistant", content: text };
      setAiMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Lỗi gọi AI chat:", error?.response?.data || error);
      setAiError("AI đang gặp sự cố, bạn thử lại sau nhé.");
    } finally {
      setAiLoading(false);
    }
  };

  /* ===================== States ===================== */
  if (loading)
    return (
      <div className="min-h-screen bg-orange-50/40">
        <div className="max-w-6xl mx-auto px-6 py-16 animate-pulse">
          <div className="h-9 w-2/3 bg-orange-200/40 rounded mb-4" />
          <div className="h-5 w-56 bg-orange-200/30 rounded mb-6" />
          <div className="aspect-video bg-orange-200/30 rounded-2xl mb-6" />
        </div>
      </div>
    );

  if (!course)
    return (
      <div className="min-h-screen bg-orange-50/40">
        <p className="text-center pt-20 text-red-500">{err || "Không tìm thấy khoá học."}</p>
      </div>
    );

  /* ===================== Render ===================== */
  return (
    <div className="min-h-screen bg-orange-50/40 text-slate-800">
      <div className="bg-gradient-to-b from-orange-50 to-white border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-3">
          <nav className="text-sm text-slate-500 flex items-center gap-1">
            <button onClick={() => navigate("/my-courses")} className="hover:text-orange-600">
              Khoá học của tôi
            </button>
            <span>/</span>
            <span className="text-slate-700">Khu học tập</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span>
                  Giảng viên:{" "}
                  <button
                    className="text-orange-600 hover:text-orange-500 underline underline-offset-2"
                    onClick={() => course.teacher?._id && navigate(`/teacher/${course.teacher._id}`)}
                  >
                    {teacherName}
                  </button>
                </span>
                <Stars value={ratingValue} />
              </div>
            </div>

            <div className="md:text-right">
              <p className="text-xs text-muted mb-1">Tiến độ khoá học</p>
              <div className="w-full md:w-64 h-2 rounded-full bg-orange-100 overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-primary font-semibold mt-1">{progress.toFixed(0)}% hoàn thành</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          {/* ===== Viewer ===== */}
          {(() => {
            const t = activeLesson?.type || "video";

            if (t === "text") {
              return (
                <div className="rounded-2xl bg-white border border-orange-100 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {activeLesson?.title || "Bài đọc"}
                    </h3>

                    <button
                      type="button"
                      onClick={handleCompleteTextLesson}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 text-white px-4 py-2 text-sm font-semibold hover:bg-orange-600"
                    >
                      <FiCheckCircle /> Đánh dấu hoàn thành
                    </button>
                  </div>

                  <div className="prose max-w-none whitespace-pre-line text-slate-800">
                    {activeLesson?.textContent || "Bài đọc chưa có nội dung."}
                  </div>
                </div>
              );
            }

            const embed = activeLesson?.video
              ? toYouTubeEmbed(activeLesson.video)
              : toYouTubeEmbed(demoUrlRaw);

            if (embed) {
              return (
                <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-lg border border-orange-100">
                  <iframe src={embed} title="Video hiện tại" className="w-full h-full" allowFullScreen />
                </div>
              );
            }

            return (
              <div className="aspect-video rounded-2xl bg-white grid place-items-center text-slate-500 border border-orange-100">
                Chọn một bài học ở danh sách bên dưới để bắt đầu.
              </div>
            );
          })()}

          {/* ===== Lesson list ===== */}
          <div className="rounded-2xl bg-white border border-orange-100 p-6">
            <h2 className="text-xl font-semibold text-orange-600 mb-4">
              Danh sách bài học{" "}
              {sections.length > 0 && (
                <span className="ml-2 text-sm text-slate-500 font-normal">
                  • {sections.length} chương •{" "}
                  {sections.reduce((s, x) => s + (x.lessons?.length || 0), 0)} bài học
                </span>
              )}
            </h2>

            {sections.length ? (
              <ul className="space-y-3">
                {sections.map((sec, secIdx) => (
                  <li key={secIdx} className="border border-orange-100 rounded-xl bg-orange-50/30">
                    <details className="group rounded-xl" open={secIdx === 0}>
                      <summary className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer select-none">
                        <div className="font-semibold text-slate-800">{sec.title}</div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span>{sec.lessons?.length || 0} bài học</span>
                          <FiChevronDown className="transition group-open:rotate-180" />
                        </div>
                      </summary>

                      <ul className="px-4 pb-3">
                        {sec.lessons?.map((ls, i) => {
                          const lessonId = ls._id || ls.id || `${secIdx}-${i}`;
                          const type = ls.__type || inferLessonType(ls);

                          const locked =
                            typeof ls.isLocked === "boolean"
                              ? ls.isLocked
                              : typeof ls.locked === "boolean"
                              ? ls.locked
                              : typeof ls.canWatch === "boolean"
                              ? !ls.canWatch
                              : false;

                          const completed = !!ls.isCompleted;

                          return (
                            <li
                              key={lessonId}
                              className="flex items-center justify-between gap-4 py-3 border-t border-orange-50 first:border-t-0"
                            >
                              <div className="min-w-0 flex items-center gap-3">
                                <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-white text-orange-600 text-xs font-semibold border border-orange-100">
                                  {i + 1}
                                </span>

                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-800 truncate">
                                    {ls.title || `Bài ${i + 1}`}
                                  </p>

                                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                                    {type === "text" ? (
                                      <span className="inline-flex items-center gap-1">
                                        <FiFileText /> Bài đọc
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1">
                                        <FiPlay /> Video
                                      </span>
                                    )}

                                    {ls.duration ? <span>• {ls.duration}</span> : null}

                                    {completed ? (
                                      <span className="inline-flex items-center gap-1 text-green-600">
                                        <FiCheckCircle /> Đã hoàn thành
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {locked ? (
                                  <span className="inline-flex items-center gap-1 text-sm text-slate-400">
                                    <FiLock /> Học bài trước
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleStartLesson(secIdx, i, ls)}
                                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border border-orange-200 bg-white hover:bg-orange-50 text-orange-600"
                                  >
                                    {type === "text" ? (
                                      <>
                                        <FiFileText /> {completed ? "Đọc lại" : "Đọc bài"}
                                      </>
                                    ) : (
                                      <>
                                        <FiPlay /> {completed ? "Xem lại" : "Xem bài"}
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">
                Khoá học chưa có danh sách bài học. Bạn hãy quay lại sau hoặc liên hệ giảng viên.
              </p>
            )}
          </div>

          {/* ===== AI ===== */}
          <div className="rounded-2xl bg-white border border-orange-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <FiZap className="text-orange-500" /> Trợ lý AI trong khoá học
              </h2>
              {aiLoading && <span className="text-[11px] text-slate-400 animate-pulse">AI đang trả lời...</span>}
            </div>

            <div className="border border-orange-100 rounded-xl bg-orange-50/40 max-h-56 overflow-y-auto mb-3 p-3 space-y-2 text-sm">
              {aiMessages.length === 0 ? (
                <p className="text-slate-500 text-sm italic">
                  Chưa có cuộc trò chuyện nào. Ví dụ:{" "}
                  <span className="font-medium">“Giải thích chương 1”, “Cho vài bài tập áp dụng”</span>.
                </p>
              ) : (
                aiMessages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                        m.role === "assistant"
                          ? "bg-white border border-orange-100 text-slate-800"
                          : "bg-orange-500 text-white"
                      }`}
                    >
                      <p className="text-[11px] font-semibold mb-0.5 opacity-80">
                        {m.role === "assistant" ? "AI trợ lý" : "Bạn"}
                      </p>
                      <p className="whitespace-pre-line text-[13px]">{m.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {aiError && <p className="text-xs text-red-500 mb-2">{aiError}</p>}

            <form onSubmit={handleAiSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                className="flex-1 border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                placeholder="Nhập câu hỏi cho AI..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                disabled={aiLoading}
              />
              <button
                type="submit"
                disabled={aiLoading || !aiInput.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-orange-500 text-white px-4 py-2 text-sm font-semibold hover:bg-orange-600 disabled:opacity-60"
              >
                <FiSend className="mr-1" /> Hỏi AI
              </button>
            </form>
          </div>

          {/* ===== Q&A ===== */}
          <div className="rounded-2xl bg-white border border-orange-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-orange-600 flex items-center gap-2">
                <FiMessageCircle /> Hỏi đáp với giảng viên
              </h2>
              {qaLoading && <span className="text-xs text-slate-400 animate-pulse">Đang tải...</span>}
            </div>

            <form onSubmit={handleAskQuestion} className="flex flex-col gap-3 mb-5">
              <textarea
                rows={3}
                className="border border-orange-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-300 outline-none"
                placeholder="Nhập câu hỏi..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 text-white px-4 py-2 text-sm font-semibold hover:bg-orange-600"
                >
                  <FiSend /> Gửi câu hỏi
                </button>
              </div>
            </form>

            {qaError && <p className="text-xs text-red-500 mb-3">{qaError}</p>}

            {questions.length ? (
              <div className="mt-2 max-h-56 overflow-y-auto pr-1">
                <ul className="space-y-3">
                  {questions.map((q, idx) => {
                    const qId = q._id || q.id || String(idx);
                    const hasAnswer = !!q.answer;
                    return (
                      <li key={qId}>
                        <div className="rounded-xl border border-orange-50 bg-orange-50/40 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {q.user?.name || q.userName || "Học viên"}{" "}
                                <span className="text-xs text-slate-400 ml-1">
                                  {q.createdAt && new Date(q.createdAt).toLocaleString("vi-VN")}
                                </span>
                              </p>
                              <p className="text-slate-700 text-sm mt-1 whitespace-pre-line">
                                {q.content || q.question}
                              </p>
                            </div>
                            <span className="text-[11px] px-2 py-1 rounded-full border text-slate-500 bg-white">
                              {hasAnswer ? "Đã trả lời" : "Chưa trả lời"}
                            </span>
                          </div>

                          {hasAnswer && (
                            <div className="mt-2 border-l-2 border-orange-300 pl-3 text-sm">
                              <p className="font-semibold text-orange-700 mb-0.5">Giảng viên trả lời:</p>
                              <p className="text-slate-700 whitespace-pre-line">{q.answer}</p>
                            </div>
                          )}

                          {!hasAnswer && canAnswerQuestions && (
                            <div className="mt-3 border-t border-orange-100 pt-3">
                              <textarea
                                rows={2}
                                className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 outline-none"
                                placeholder="Nhập câu trả lời..."
                                value={answerDrafts[qId] || ""}
                                onChange={(e) =>
                                  setAnswerDrafts((prev) => ({ ...prev, [qId]: e.target.value }))
                                }
                              />
                              <div className="mt-2 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setAnswerDrafts((prev) => ({ ...prev, [qId]: "" }))}
                                  className="px-3 py-1.5 rounded-xl border border-border text-xs text-muted hover:bg-orange-50"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSubmitAnswer(qId)}
                                  className="px-4 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 inline-flex items-center gap-1"
                                >
                                  <FiSend /> Gửi trả lời
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">Chưa có câu hỏi nào.</p>
            )}
          </div>

          {/* ===== Study room ===== */}
          <div className="rounded-2xl bg-white border border-orange-100 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 shrink-0">
                <FaUsers size={18} />
              </span>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-slate-900">Phòng học nhóm cho khoá này</h2>
                <p className="mt-1 text-xs md:text-sm text-slate-600">
                  Vào phòng học nhóm để trao đổi bài tập, làm việc nhóm và gọi thoại với bạn cùng lớp.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/study-rooms?courseId=${id}`)}
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-4 py-2 text-xs md:text-sm font-semibold text-white hover:bg-orange-600 shadow-sm"
            >
              Mở phòng học nhóm
            </button>
          </div>
        </section>

        {/* ===== Right column ===== */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 rounded-2xl bg-white shadow-md border border-orange-100 p-4 space-y-4">
            <img
              src={courseImage || "https://placehold.co/560x315?text=Course"}
              alt={title}
              className="w-full h-40 object-cover rounded-xl border border-orange-100"
            />

            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Tiến độ học tập</p>
              <div className="h-2 rounded-full bg-orange-100 overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">Bạn đã hoàn thành khoảng {progress.toFixed(0)}% khoá học.</p>
            </div>

            <div className="pt-3 border-t border-orange-100">
              <p className="text-sm font-medium text-slate-700 mb-2">Bài tập &amp; bài kiểm tra</p>

              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Bài tập về nhà</p>
                  {homeworkList.length ? (
                    <div className="space-y-2">
                      {homeworkList.map((hw) => {
                        const status = (hw.latestAttempt?.status || "").toLowerCase();
                        const done = ["submitted", "graded", "timeout"].includes(status);
                        const linkPath = done ? getExamResultPath(hw) : getExamDoPath(hw);
                        return (
                          <Link
                            key={hw.examId || hw._id || hw.id}
                            to={linkPath}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs sm:text-sm transition ${
                              done
                                ? "bg-emerald-50/60 border-emerald-200 text-emerald-700"
                                : "bg-orange-50/40 border-orange-100 text-slate-700 hover:bg-orange-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-white/80 border border-orange-100">
                                <FiFileText className={done ? "text-emerald-500" : "text-orange-500"} size={15} />
                              </span>
                              <span className="font-medium">{hw.title || "Bài tập về nhà"}</span>
                            </div>
                            {done ? (
                              <span className="text-[11px] font-semibold">Xem kết quả</span>
                            ) : (
                              <span className="text-[11px] text-orange-600 font-semibold">Làm ngay</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-3 py-2 rounded-xl border text-xs sm:text-sm bg-slate-50 border-slate-200 text-slate-400 opacity-70">
                      Chưa có bài tập cho khoá này
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase mb-1">Bài kiểm tra / Quiz</p>
                  {examList.length ? (
                    <div className="space-y-2">
                      {examList.map((ex) => {
                        const status = (ex.latestAttempt?.status || "").toLowerCase();
                        const done = ["submitted", "graded", "timeout"].includes(status);
                        const linkPath = done ? getExamResultPath(ex) : getExamDoPath(ex);
                        return (
                          <Link
                            key={ex.examId || ex._id || ex.id}
                            to={linkPath}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs sm:text-sm transition ${
                              done
                                ? "bg-emerald-50/60 border-emerald-200 text-emerald-700"
                                : "bg-orange-50/40 border-orange-100 text-slate-700 hover:bg-orange-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-white/80 border border-orange-100">
                                <FiFileText className={done ? "text-emerald-500" : "text-orange-500"} size={15} />
                              </span>
                              <span className="font-medium">{ex.title || "Bài kiểm tra"}</span>
                            </div>
                            {done ? (
                              <span className="text-[11px] font-semibold">Xem kết quả</span>
                            ) : (
                              <span className="text-[11px] text-orange-600 font-semibold">Làm ngay</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-3 py-2 rounded-xl border text-xs sm:text-sm bg-slate-50 border-slate-200 text-slate-400 opacity-70">
                      Chưa có bài kiểm tra cho khoá này
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-sm text-slate-600 space-y-1">
              <p>
                <span className="font-medium">Tổng số bài học:</span> {totalLessons || 0}
              </p>
            </div>

            <div className="pt-2 border-t border-orange-100">
              <Link
                to="/my-courses"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted hover:bg-orange-50 w-full"
              >
                ← Quay lại khoá học của tôi
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
