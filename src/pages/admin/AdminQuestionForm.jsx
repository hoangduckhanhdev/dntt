// src/pages/admin/AdminQuestionForm.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import examQuestionApi from "../../api/examQuestionApi";

const API_BASE = "http://localhost:5000/api";

const TYPE_OPTIONS = [
  { value: "multiple_choice", label: "Trắc nghiệm nhiều lựa chọn" },
  { value: "true_false", label: "Đúng / Sai" },
  {
    value: "short_answer",
    label: "Tự luận ngắn (so sánh đáp án / hoặc AI chấm)",
  },
  {
    value: "essay",
    label: "Bài luận (giáo viên hoặc AI chấm)",
  },
  { value: "file_upload", label: "Nộp file (giáo viên chấm tay)" },
];

export default function AdminQuestionForm() {
  const { id } = useParams(); // khi edit có id
  const navigate = useNavigate();
  const location = useLocation();

  const isEdit = !!id;
  const questionFromState = location.state?.question || null;
  const courseDefault = location.state?.courseDefault || "";

  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({ chapters: [], tags: [] });

  const [saving, setSaving] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    course: "",
    type: "multiple_choice",
    content: "",
    chapter: "",
    difficulty: "medium",
    score: 1,
    tagsInput: "",
    correctAnswer: "", // dùng cho true_false + short_answer
    expectedAnswer: "", // dùng cho essay (gợi ý cho AI)
    aiAutoGrade: false, // bật/tắt AI chấm cho short_answer / essay
  });

  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  // ------- load courses -------
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/admin/courses`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: { page: 1, limit: 1000 },
        });

        const data = res.data;
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.items)
          ? data.items
          : [];

        setCourses(items);

        // nếu tạo mới từ 1 course cụ thể
        if (!isEdit) {
          setForm((prev) => ({
            ...prev,
            course: courseDefault || "",
          }));
        }
      } catch (err) {
        console.error("Lỗi load khoá học:", err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------- nếu edit, lấy dữ liệu từ state -------
  useEffect(() => {
    if (isEdit && questionFromState) {
      const q = questionFromState;
      setForm((prev) => ({
        ...prev,
        course: q.course?._id || q.course || "",
        type: q.type || "multiple_choice",
        content: q.content || "",
        chapter: q.chapter || "",
        difficulty: q.difficulty || "medium",
        score: q.score ?? 1,
        tagsInput: (q.tags || []).join(", "),
        correctAnswer: q.correctAnswer || "",
        expectedAnswer: q.expectedAnswer || "",
        aiAutoGrade: !!q.aiAutoGrade,
      }));
      setOptions(
        q.options && q.options.length
          ? q.options.map((o) => ({
              text: o.text,
              isCorrect: !!o.isCorrect,
            }))
          : options
      );
    }
  }, [isEdit, questionFromState]);

  // ------- load filters theo course -------
  useEffect(() => {
    const fetchFilters = async () => {
      if (!form.course) {
        setFilters({ chapters: [], tags: [] });
        return;
      }
      try {
        const data = await examQuestionApi.admin.getFilters(form.course);
        setFilters({
          chapters: data.chapters || [],
          tags: data.tags || [],
        });
      } catch (err) {
        console.error("Lỗi lấy filters câu hỏi:", err);
      }
    };
    fetchFilters();
  }, [form.course]);

  // ------- handlers -------
  const handleChange = (field) => (e) => {
    const value =
      field === "score"
        ? Number(e.target.value || 0)
        : field === "aiAutoGrade"
        ? e.target.checked
        : e.target.value;

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, key, value) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === index ? { ...opt, [key]: key === "isCorrect" ? value : value } : opt
      )
    );
  };

  const addOption = () => {
    setOptions((prev) => [...prev, { text: "", isCorrect: false }]);
  };

  const removeOption = (index) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCorrect = (index) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.course) {
      alert("Vui lòng chọn khoá học.");
      return;
    }
    if (!form.content.trim()) {
      alert("Vui lòng nhập nội dung câu hỏi.");
      return;
    }

    // build payload base
    const payload = {
      course: form.course,
      content: form.content.trim(),
      type: form.type,
      chapter: form.chapter || "",
      difficulty: form.difficulty,
      score: Number(form.score) || 1,
      tags: form.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      // aiAutoGrade & expectedAnswer sẽ fill theo type bên dưới
    };

    // ===== TYPE SPECIFIC =====
    if (form.type === "multiple_choice") {
      const cleanOptions = options
        .map((o) => ({ text: o.text.trim(), isCorrect: !!o.isCorrect }))
        .filter((o) => o.text);

      if (cleanOptions.length < 2) {
        alert("Trắc nghiệm cần ít nhất 2 phương án.");
        return;
      }
      if (!cleanOptions.some((o) => o.isCorrect)) {
        alert("Hãy chọn ít nhất 1 đáp án đúng.");
        return;
      }

      payload.options = cleanOptions;
      payload.correctAnswer = "";
      payload.expectedAnswer = "";
      payload.aiAutoGrade = false;
    } else if (form.type === "true_false") {
      if (!form.correctAnswer) {
        alert('Vui lòng chọn "Đúng" hoặc "Sai" cho câu Đúng/Sai.');
        return;
      }
      payload.correctAnswer = form.correctAnswer; // "true" | "false"
      payload.options = [];
      payload.expectedAnswer = "";
      payload.aiAutoGrade = false;
    } else if (form.type === "short_answer") {
      // 2 mode:
      // - aiAutoGrade = false → so sánh chuỗi correctAnswer
      // - aiAutoGrade = true  → AI chấm, correctAnswer làm gợi ý (nếu có)
      if (!form.correctAnswer.trim() && !form.aiAutoGrade) {
        alert(
          "Tự luận ngắn: hãy nhập đáp án đúng hoặc bật chế độ AI chấm tự động."
        );
        return;
      }
      payload.correctAnswer = form.correctAnswer.trim();
      payload.options = [];
      payload.expectedAnswer = "";
      payload.aiAutoGrade = !!form.aiAutoGrade;
    } else if (form.type === "essay") {
      // essay: nếu bật AI thì cần expectedAnswer
      if (form.aiAutoGrade && !form.expectedAnswer.trim()) {
        alert(
          "Bài luận dùng AI chấm: hãy nhập gợi ý đáp án (expectedAnswer) để AI dựa vào."
        );
        return;
      }
      payload.options = [];
      payload.correctAnswer = "";
      payload.expectedAnswer = form.expectedAnswer.trim();
      payload.aiAutoGrade = !!form.aiAutoGrade;
    } else if (form.type === "file_upload") {
      payload.options = [];
      payload.correctAnswer = "";
      payload.expectedAnswer = "";
      payload.aiAutoGrade = false;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await examQuestionApi.admin.updateQuestion(id, payload);
      } else {
        await examQuestionApi.admin.createQuestion(payload);
      }

      navigate("/admin/exam-questions");
    } catch (err) {
      console.error(err);
      setErr(
        err?.response?.data?.message ||
          "Lưu câu hỏi thất bại. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  const currentType = form.type;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">
        {isEdit ? "Chỉnh sửa câu hỏi" : "Tạo câu hỏi mới"}
      </h1>
      <p className="text-sm text-slate-500 mb-4">
        Câu hỏi thuộc ngân hàng của khoá học. Đề thi sẽ rút câu từ đây theo chế
        độ Manual hoặc Auto AI.
      </p>

      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-4"
      >
        {/* Khoá học */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Khoá học <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={form.course}
            onChange={handleChange("course")}
          >
            <option value="">-- Chọn khoá học --</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title || c.name}
              </option>
            ))}
          </select>
          {loadingCourses && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Đang tải khoá học...
            </p>
          )}
        </div>

        {/* Nội dung câu hỏi */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nội dung câu hỏi <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            value={form.content}
            onChange={handleChange("content")}
            placeholder="Nhập nội dung câu hỏi..."
          />
        </div>

        {/* Loại / chương / độ khó / điểm */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Loại câu hỏi
            </label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.type}
              onChange={handleChange("type")}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Chương
            </label>
            <input
              list="chapter-list"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.chapter}
              onChange={handleChange("chapter")}
              placeholder="VD: Chương 1, Bài 2..."
            />
            {filters.chapters?.length > 0 && (
              <datalist id="chapter-list">
                {filters.chapters.map((ch) => (
                  <option key={ch} value={ch} />
                ))}
              </datalist>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Độ khó
            </label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.difficulty}
              onChange={handleChange("difficulty")}
            >
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
        </div>

        {/* Tag + điểm */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tags
            </label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.tagsInput}
              onChange={handleChange("tagsInput")}
              placeholder="VD: chương_1, thì_hiện_tại, ôn_tập..."
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ngăn cách bởi dấu phẩy, dùng để lọc khi tạo đề thi.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Điểm
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={form.score}
              onChange={handleChange("score")}
            />
          </div>
        </div>

        {/* --- PHẦN ĐÁP ÁN TUỲ LOẠI --- */}
        {currentType === "multiple_choice" && (
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Đáp án trắc nghiệm
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Đánh dấu các đáp án đúng. Có thể có 1 hoặc nhiều đáp án đúng.
            </p>
            <div className="space-y-2">
              {options.map((opt, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 py-1"
                >
                  <input
                    type="checkbox"
                    checked={opt.isCorrect}
                    onChange={() => toggleCorrect(index)}
                    className="mr-1"
                  />
                  <input
                    className="flex-1 border-none outline-none text-sm"
                    placeholder={`Đáp án ${index + 1}`}
                    value={opt.text}
                    onChange={(e) =>
                      handleOptionChange(index, "text", e.target.value)
                    }
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-xs text-red-500 px-2"
                    >
                      X
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-3 text-xs px-3 py-1 rounded border border-slate-200 hover:bg-slate-50"
            >
              + Thêm đáp án
            </button>
          </div>
        )}

        {(currentType === "true_false" ||
          currentType === "short_answer") && (
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-1">
              Đáp án đúng
            </h3>
            {currentType === "true_false" ? (
              <div className="flex gap-4 text-sm">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="tf"
                    checked={form.correctAnswer === "true"}
                    onChange={() =>
                      setForm((prev) => ({ ...prev, correctAnswer: "true" }))
                    }
                  />
                  <span>Đúng</span>
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="tf"
                    checked={form.correctAnswer === "false"}
                    onChange={() =>
                      setForm((prev) => ({ ...prev, correctAnswer: "false" }))
                    }
                  />
                  <span>Sai</span>
                </label>
              </div>
            ) : (
              <>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={form.correctAnswer}
                  onChange={handleChange("correctAnswer")}
                  placeholder="Đáp án chuẩn (so sánh không phân biệt hoa/thường, bỏ khoảng trắng thừa)"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    id="ai-short-answer"
                    type="checkbox"
                    checked={form.aiAutoGrade}
                    onChange={handleChange("aiAutoGrade")}
                  />
                  <label
                    htmlFor="ai-short-answer"
                    className="text-xs text-slate-600"
                  >
                    Bật AI chấm tự luận ngắn (dùng đáp án trên làm gợi ý, giáo
                    viên vẫn có thể sửa điểm sau)
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {currentType === "essay" && (
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 mb-1">
              Thiết lập chấm bài luận
            </h3>
            <div className="flex items-center gap-2">
              <input
                id="ai-essay"
                type="checkbox"
                checked={form.aiAutoGrade}
                onChange={handleChange("aiAutoGrade")}
              />
              <label htmlFor="ai-essay" className="text-xs text-slate-600">
                Bật AI gợi ý điểm & nhận xét cho bài luận
              </label>
            </div>
            {form.aiAutoGrade && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Gợi ý đáp án / tiêu chí chấm (expectedAnswer)
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  value={form.expectedAnswer}
                  onChange={handleChange("expectedAnswer")}
                  placeholder="Mô tả các ý chính, tiêu chí chấm điểm để AI tham khảo..."
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  AI sẽ dựa trên phần này để chấm điểm. Giáo viên vẫn xem bài
                  làm & chỉnh điểm thủ công trong giao diện chấm.
                </p>
              </div>
            )}
            {!form.aiAutoGrade && (
              <p className="text-xs text-slate-500">
                Nếu không bật AI, bài luận sẽ được giáo viên chấm thủ công dựa
                trên bài làm của học viên.
              </p>
            )}
          </div>
        )}

        {currentType === "file_upload" && (
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">
              Chấm điểm thủ công
            </h3>
            <p className="text-xs text-slate-500">
              Với dạng nộp file, hệ thống chỉ lưu file học viên gửi. Giáo viên
              sẽ mở file và chấm điểm thủ công trong màn hình chấm bài.
            </p>
          </div>
        )}

        {/* Btns */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate("/admin/exam-questions")}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo câu hỏi"}
          </button>
        </div>
      </form>
    </div>
  );
}
