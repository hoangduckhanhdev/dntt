import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import examQuestionApi from "../../api/examQuestionApi";
import examApi from "../../api/examApi";

const API_BASE = "http://localhost:5000/api";

const guessSubjectFromCourseTitle = (title = "") => {
  const t = (title || "").toLowerCase();
  if (t.includes("tiếng anh") || t.includes("ielts") || t.includes("toeic")) return "english";
  if (
    t.includes("react") ||
    t.includes("javascript") ||
    t.includes("node") ||
    t.includes("lập trình") ||
    t.includes("web") ||
    t.includes("php") ||
    t.includes("java") ||
    t.includes("python")
  )
    return "programming";
  if (t.includes("toán") || t.includes("math")) return "math";
  if (t.includes("logic") || t.includes("tư duy")) return "logic";
  return "other";
};

export default function AdminQuestionBank() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([]);

  const [filters, setFilters] = useState({ chapters: [], tags: [] });

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const [course, setCourse] = useState(searchParams.get("course") || "");
  const [chapter, setChapter] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");

  const [deletingAll, setDeletingAll] = useState(false);

  const [aiSubject, setAiSubject] = useState("other");
  const [aiTopic, setAiTopic] = useState("");
  const [aiLevel, setAiLevel] = useState("medium");
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [aiQuestionType, setAiQuestionType] = useState("multiple_choice");
  const [aiLanguage, setAiLanguage] = useState("vi");

  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [savingAiIndex, setSavingAiIndex] = useState(null);
  const [savingAllAi, setSavingAllAi] = useState(false);

  const courseMap = useMemo(() => {
    const map = {};
    courses.forEach((c) => (map[c._id] = c.title || c.name));
    return map;
  }, [courses]);

  const difficultyLabel = (d) =>
    d === "easy" ? "Dễ" : d === "medium" ? "Trung bình" : d === "hard" ? "Khó" : d;

  const typeLabel = (t) =>
    t === "multiple_choice"
      ? "Trắc nghiệm"
      : t === "true_false"
      ? "Đúng / Sai"
      : t === "short_answer"
      ? "Tự luận ngắn"
      : t === "essay"
      ? "Bài luận"
      : t === "file_upload"
      ? "Nộp file"
      : t;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const token = localStorage.getItem("token");
        const rawUser = localStorage.getItem("user");
        const currentUser = rawUser ? JSON.parse(rawUser) : null;
        const role = currentUser?.role;

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        let url = `${API_BASE}/admin/courses`;
        let params = { page: 1, limit: 1000 };

        if (role === "teacher") {
          url = `${API_BASE}/teacher/my-courses`;
          params = {};
        }

        let res;
        try {
          res = await axios.get(url, { headers, params });
        } catch (err) {
          if (role === "teacher") {
            res = await axios.get(`${API_BASE}/admin/courses`, {
              headers,
              params: { page: 1, limit: 1000 },
            });
          } else {
            throw err;
          }
        }

        const data = res.data;
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.items)
          ? data.items
          : [];

        setCourses(items);
      } catch (err) {
        console.error("Lỗi load khoá học:", err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchFilters = async () => {
      if (!course) {
        setFilters({ chapters: [], tags: [] });
        setChapter("");
        setSelectedTags([]);
        return;
      }
      try {
        const data = await examQuestionApi.admin.getFilters(course, chapter || undefined);

        const chapters = Array.isArray(data.chapters) ? data.chapters : [];
        const tags = Array.isArray(data.tags) ? data.tags : [];

        setFilters({ chapters, tags });

        if (!chapter && chapters.length > 0) {
          setChapter(chapters[0]);
        }
      } catch (err) {
        console.error("Lỗi lấy filters câu hỏi:", err);
        setFilters({ chapters: [], tags: [] });
        setChapter("");
        setSelectedTags([]);
      }
    };

    fetchFilters();
  }, [course, chapter]);

  const tagOptions = useMemo(() => {
    return (filters.tags || []).map((t) => ({ label: t, value: t }));
  }, [filters.tags]);

  const loadQuestions = async () => {
    if (!course) return setQuestions([]);
    try {
      setLoadingQuestions(true);
      const params = {
        course,
        chapter: chapter || undefined,
        tags: selectedTags.length ? selectedTags : undefined,
        difficulty: difficulty || undefined,
        q: search || undefined,
      };
      const { items } = await examQuestionApi.admin.getQuestions(params);
      setQuestions(items || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách câu hỏi:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (course) loadQuestions();
  }, [course, chapter, selectedTags, difficulty]);

  const handleCourseChange = (e) => {
    const value = e.target.value;
    setCourse(value);

    setChapter("");
    setSelectedTags([]);
    setDifficulty("");

    const next = new URLSearchParams(searchParams);
    if (value) next.set("course", value);
    else next.delete("course");
    setSearchParams(next);

    setAiQuestions([]);
    setAiError("");

    const selectedCourse = courses.find((c) => c._id === value);
    if (selectedCourse) {
      const title = selectedCourse.title || selectedCourse.name || "";
      setAiSubject(guessSubjectFromCourseTitle(title));
    } else {
      setAiSubject("other");
    }
  };

  const handleDelete = async (q) => {
    if (!window.confirm("Xoá câu hỏi này?")) return;
    try {
      await examQuestionApi.admin.deleteQuestion(q._id);
      await loadQuestions();
    } catch (err) {
      console.error(err);
      alert("Xoá câu hỏi thất bại");
    }
  };

  const handleImport = async () => {
    if (!course) return alert("Vui lòng chọn khoá học trước khi import!");
    if (!importFile) return alert("Vui lòng chọn file Excel hoặc CSV.");

    try {
      setImporting(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("course", course);

      const res = await axios.post(`${API_BASE}/admin/exam-questions/import`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      const inserted = res?.data?.inserted ?? res?.data?.count ?? 0;
      const msg =
        res?.data?.message || (inserted ? `✔ Import thành công ${inserted} câu hỏi` : "✔ Import thành công");
      alert(msg);

      setImportFile(null);
      await loadQuestions();
    } catch (err) {
      console.error("Import lỗi:", err.response?.data || err);
      alert(err?.response?.data?.message || "Import thất bại. Kiểm tra lại file.");
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!course) return alert("Vui lòng chọn khoá học trước.");

    const firstConfirm = window.confirm("Bạn chắc chắn muốn XOÁ TOÀN BỘ ngân hàng câu hỏi của khoá học này?");
    if (!firstConfirm) return;

    const secondConfirm = window.confirm("Hành động này KHÔNG THỂ hoàn tác. Nhấn OK để xoá vĩnh viễn TẤT CẢ câu hỏi.");
    if (!secondConfirm) return;

    try {
      setDeletingAll(true);
      const res = await examQuestionApi.admin.getQuestions({ course, page: 1, limit: 5000 });
      const items = res?.items || [];
      if (!items.length) return alert("Khoá học này hiện không có câu hỏi nào.");

      await Promise.all(items.map((q) => examQuestionApi.admin.deleteQuestion(q._id)));
      await loadQuestions();
      alert("Đã xoá toàn bộ ngân hàng câu hỏi của khoá này.");
    } catch (err) {
      console.error("Xoá toàn bộ câu hỏi lỗi:", err);
      alert("Có lỗi khi xoá hàng loạt. Một số câu có thể chưa bị xoá hết, hãy kiểm tra lại.");
    } finally {
      setDeletingAll(false);
    }
  };

  const handleGenerateByAI = async () => {
    if (!course) return alert("Vui lòng chọn khoá học trước khi dùng AI sinh câu hỏi.");
    if (!String(chapter || "").trim()) {
      alert("Bạn cần chọn/nhập 'Chương' trước khi sinh câu hỏi bằng AI.");
      return;
    }

    try {
      setAiError("");
      setAiLoading(true);
      setAiQuestions([]);

      const payload = {
        subject: aiSubject,
        topic: aiTopic,
        level: aiLevel,
        numQuestions: aiNumQuestions,
        questionType: aiQuestionType,
        language: aiLanguage,
        courseTitle: courseMap[course] || "",
        chapter: String(chapter || "").trim(),
      };

      const res = await examApi.questionBank.generateByAI(payload);

      const ok = typeof res?.ok === "boolean" ? res.ok : true;
      const list = Array.isArray(res?.questions) ? res.questions : Array.isArray(res) ? res : [];

      if (!ok) {
        setAiError(res?.error || res?.message || "AI không sinh được câu hỏi, thử lại sau.");
        return;
      }

      setAiQuestions(list);
    } catch (err) {
      console.error("Lỗi gọi AI generate-questions:", err);
      setAiError("Lỗi khi gọi AI. Vui lòng thử lại sau.");
    } finally {
      setAiLoading(false);
    }
  };

  const buildPayloadFromAIQuestion = (q) => {
    const type = q.type || aiQuestionType;
    const safeChapter = String(chapter || "").trim();

    let options = Array.isArray(q.options) ? q.options : [];
    if (type === "multiple_choice") {
      options = options
        .map((op) => {
          if (typeof op === "string") return { text: op, isCorrect: false };
          return { text: op?.text || "", isCorrect: !!op?.isCorrect };
        })
        .filter((op) => String(op.text).trim());

      if (!options.some((o) => o.isCorrect) && q.correctAnswerText) {
        const ans = String(q.correctAnswerText).trim().toLowerCase();
        options = options.map((o) => ({
          ...o,
          isCorrect: String(o.text).trim().toLowerCase() === ans,
        }));
      }
    }

    let correctAnswer = String(q.correctAnswerText || q.correctAnswer || "").trim();

    if (type === "true_false") {
      const v = correctAnswer.toLowerCase();
      correctAnswer = v === "false" ? "false" : "true";
    }

    let aiAutoGrade = false;
    if (type === "short_answer") {
      if (!correctAnswer) aiAutoGrade = true;
    }

    const tags = [aiSubject, ...(aiTopic ? [aiTopic] : [])].filter(Boolean);

    return {
      course,
      content: String(q.content || "").trim(),
      type,
      options: type === "multiple_choice" ? options : [],
      correctAnswer: ["short_answer", "true_false"].includes(type) ? correctAnswer : "",
      chapter: safeChapter,
      difficulty: aiLevel,
      tags,
      score: 1,
      aiAutoGrade,
    };
  };

  const handleSaveAIQuestion = async (q, index) => {
    if (!course) return alert("Vui lòng chọn khoá học trước.");
    if (!String(chapter || "").trim()) return alert("Bạn cần chọn/nhập 'Chương' trước khi lưu câu hỏi AI.");

    try {
      setSavingAiIndex(index);
      const payload = buildPayloadFromAIQuestion(q);
      await examQuestionApi.admin.createQuestion(payload);
      await loadQuestions();
      alert("✔ Đã lưu 1 câu hỏi từ AI vào ngân hàng.");
    } catch (err) {
      console.error("Lỗi lưu câu hỏi AI:", err);
      alert(err?.response?.data?.message || "Lưu câu hỏi AI thất bại. Kiểm tra log server.");
    } finally {
      setSavingAiIndex(null);
    }
  };

  const handleSaveAllAIQuestions = async () => {
    if (!course) return alert("Vui lòng chọn khoá học trước.");
    if (!aiQuestions.length) return alert("Chưa có câu hỏi AI nào để lưu.");
    if (!String(chapter || "").trim()) return alert("Bạn cần chọn/nhập 'Chương' trước khi lưu câu hỏi AI.");

    try {
      setSavingAllAi(true);
      const payloads = aiQuestions.map(buildPayloadFromAIQuestion);
      await Promise.all(payloads.map((p) => examQuestionApi.admin.createQuestion(p)));
      await loadQuestions();
      alert(`✔ Đã lưu ${aiQuestions.length} câu hỏi AI vào ngân hàng.`);
    } catch (err) {
      console.error("Lỗi lưu tất cả câu hỏi AI:", err?.response?.status, err?.response?.data || err);
      alert(err?.response?.data?.message || "Lưu tất cả câu hỏi AI thất bại (400). Xem console để biết lý do.");
    } finally {
      setSavingAllAi(false);
    }
  };

  const courseHasChapters = (filters.chapters || []).length > 0;

  const reactSelectStyles = {
    control: (base) => ({
      ...base,
      minHeight: 40,
      borderColor: "#e2e8f0",
      boxShadow: "none",
      borderRadius: 8,
    }),
    valueContainer: (base) => ({ ...base, padding: "0 10px" }),
    indicatorsContainer: (base) => ({ ...base, height: 40 }),
    menu: (base) => ({ ...base, zIndex: 50 }),
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ngân hàng câu hỏi</h1>
          <p className="text-sm text-slate-500">Quản lý – Import – Tạo mới các câu hỏi cho khoá học.</p>
        </div>

        <button
          onClick={() =>
            navigate("/admin/exam-questions/new", {
              state: { courseDefault: course, chapterDefault: chapter },
            })
          }
          className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
        >
          + Tạo câu hỏi
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 mb-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Khoá học</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={course}
              onChange={handleCourseChange}
              disabled={loadingCourses}
            >
              <option value="">{loadingCourses ? "Đang tải..." : "-- Chọn khoá học --"}</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title || c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="text-xs font-medium text-slate-600">Chương</label>

            {courseHasChapters ? (
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={chapter}
                onChange={(e) => {
                  setChapter(e.target.value);
                  setSelectedTags([]);
                }}
                disabled={!course}
              >
                <option value="">(Tất cả)</option>
                {(filters.chapters || []).map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Khoá học chưa có chương - nhập tên chương tạm..."
                  value={chapter}
                  onChange={(e) => {
                    setChapter(e.target.value);
                    setSelectedTags([]);
                  }}
                  disabled={!course}
                />
              </>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Tags</label>
            <Select
              isMulti
              placeholder="Chọn tags"
              options={tagOptions}
              value={tagOptions.filter((o) => selectedTags.includes(o.value))}
              onChange={(opts) => setSelectedTags((opts || []).map((o) => o.value))}
              isDisabled={!course}
              styles={reactSelectStyles}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Độ khó</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={!course}
            >
              <option value="">(Tất cả)</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Tìm theo nội dung câu hỏi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!course}
          />
          <button
            onClick={loadQuestions}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
          >
            Làm mới
          </button>
        </div>

        <div className="pt-3 border-t border-slate-200">
          <label className="text-xs font-medium text-slate-600">Import từ Excel / CSV</label>
          <div className="flex items-center gap-3 mt-2">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="text-sm"
              disabled={!course}
            />
            <button
              onClick={handleImport}
              disabled={!importFile || !course || importing}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
            >
              {importing ? "Đang import..." : "Import file"}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            File mẫu: content | type | options (a|b|c) | correct | chapter | difficulty | tags | score
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800">🤖 Sinh câu hỏi bằng AI</h2>
          {!course && <span className="text-[11px] text-red-500">Chọn khoá học trước khi dùng AI.</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Khoá học</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm bg-slate-50"
              value={course ? courseMap[course] || "Khoá học không xác định" : "Chưa chọn khoá học"}
              disabled
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Độ khó (level)</label>
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              value={aiLevel}
              onChange={(e) => setAiLevel(e.target.value)}
              disabled={!course}
            >
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Số câu hỏi</label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-full border rounded px-2 py-1 text-sm"
              value={aiNumQuestions}
              onChange={(e) => setAiNumQuestions(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
              disabled={!course}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Chủ đề / Tag (topic)</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="VD: Props, Hooks, List rendering..."
              disabled={!course}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Topic dùng làm <b>tag</b>. Chương thì chọn/nhập ở dropdown “Chương”.
            </p>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Dạng câu hỏi</label>
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              value={aiQuestionType}
              onChange={(e) => setAiQuestionType(e.target.value)}
              disabled={!course}
            >
              <option value="multiple_choice">Trắc nghiệm</option>
              <option value="true_false">Đúng / Sai</option>
              <option value="short_answer">Tự luận ngắn</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Ngôn ngữ câu hỏi</label>
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              value={aiLanguage}
              onChange={(e) => setAiLanguage(e.target.value)}
              disabled={!course}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {course && !String(chapter || "").trim() && (
          <p className="text-[11px] text-amber-600 mt-2">
            Bạn chưa chọn/nhập <b>Chương</b>. Backend đang bắt buộc chapter khi lưu, nên hãy chọn/nhập 1 chương để sinh/lưu AI.
          </p>
        )}

        {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="px-3 py-1.5 rounded bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-60"
            onClick={handleGenerateByAI}
            disabled={!course || aiLoading}
          >
            {aiLoading ? "AI đang sinh câu hỏi..." : "Sinh câu hỏi bằng AI"}
          </button>

          {aiQuestions.length > 0 && (
            <button
              className="px-3 py-1.5 rounded bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-60"
              onClick={handleSaveAllAIQuestions}
              disabled={!course || savingAllAi}
            >
              {savingAllAi ? "Đang lưu tất cả..." : "💾 Lưu TẤT CẢ vào ngân hàng"}
            </button>
          )}
        </div>

        {aiQuestions.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="text-xs text-slate-500 mb-2">AI đã sinh {aiQuestions.length} câu. Bạn có thể lưu trực tiếp vào ngân hàng.</p>

            <div className="space-y-2 text-xs max-h-96 overflow-auto pr-1">
              {aiQuestions.map((q, idx) => (
                <div key={idx} className="border rounded p-2 bg-slate-50/80">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold mb-1">
                      Câu {idx + 1}: {q.content}
                    </div>
                    <button
                      className="shrink-0 text-[11px] px-2 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                      onClick={() => handleSaveAIQuestion(q, idx)}
                      disabled={savingAiIndex === idx || !course || savingAllAi}
                    >
                      {savingAiIndex === idx ? "Đang lưu..." : "Lưu 1 câu"}
                    </button>
                  </div>

                  {q.options && q.options.length > 0 && (
                    <ul className="list-disc pl-4 mb-1 mt-1">
                      {q.options.map((op, i) => (
                        <li key={i}>
                          {op.text} {op.isCorrect && <span className="text-emerald-600 font-semibold">(Đáp án đúng)</span>}
                        </li>
                      ))}
                    </ul>
                  )}

                  {q.correctAnswerText && (
                    <div className="mt-1">
                      <span className="font-semibold">Đáp án mẫu:</span> {q.correctAnswerText}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-1 text-slate-600">
                      <span className="font-semibold">Giải thích:</span> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm">
        <div className="border-b border-slate-100 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-slate-600">{course ? `Đang xem ${questions.length} câu hỏi` : "Vui lòng chọn khoá học"}</span>

          {course && (
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {deletingAll ? "Đang xoá..." : "🗑 Xoá toàn bộ câu hỏi của khoá này"}
            </button>
          )}
        </div>

        {loadingQuestions ? (
          <div className="p-4 text-sm text-slate-500">Đang tải câu hỏi...</div>
        ) : !course ? (
          <div className="p-4 text-sm text-slate-500">Chọn khoá học để xem câu hỏi.</div>
        ) : questions.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">Chưa có câu hỏi.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="px-4 py-2 text-left w-12">#</th>
                <th className="px-4 py-2 text-left">Nội dung</th>
                <th className="px-4 py-2 text-left">Chương</th>
                <th className="px-4 py-2 text-left">Độ khó</th>
                <th className="px-4 py-2 text-right">Điểm</th>
                <th className="px-4 py-2 text-left">Loại</th>
                <th className="px-4 py-2 text-right">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {questions.map((q, idx) => (
                <tr key={q._id} className={idx % 2 ? "bg-slate-50" : ""}>
                  <td className="px-4 py-2">{idx + 1}</td>

                  <td className="px-4 py-2 max-w-xl">
                    <div className="line-clamp-3">{q.content}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(q.tags || []).map((t) => (
                        <span key={t} className="px-2 py-[2px] rounded bg-orange-50 text-[11px] text-orange-600">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-2">{q.chapter || "—"}</td>
                  <td className="px-4 py-2">{difficultyLabel(q.difficulty)}</td>
                  <td className="px-4 py-2 text-right">{q.score}</td>
                  <td className="px-4 py-2">{typeLabel(q.type)}</td>

                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() =>
                        navigate(`/admin/exam-questions/edit/${q._id}`, {
                          state: { question: q },
                        })
                      }
                      className="text-xs px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 mr-2"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(q)}
                      className="text-xs px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
