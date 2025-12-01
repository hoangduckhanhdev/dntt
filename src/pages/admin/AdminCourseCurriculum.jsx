import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

/* =========================
   YouTube helpers (robust)
========================= */
const extractYouTubeId = (input = "") => {
  if (!input) return "";
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^m\./, "");
    if (host.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return id;
    }
    const v = url.searchParams.get("v");
    if (v) return v;
    const m = url.pathname.match(/\/(embed|shorts|live|v)\/([^/?#]+)/i);
    if (m?.[2]) return m[2];
    return "";
  } catch {
    return (input || "").split(/[?#&]/)[0];
  }
};
const toCleanWatchUrl = (input = "") => {
  const id = (extractYouTubeId(input) || "").replace(/[^a-zA-Z0-9_-]/g, "");
  return id ? `https://www.youtube.com/watch?v=${id}` : "";
};

export default function AdminCourseCurriculum() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [videoDemo, setVideoDemo] = useState("");
  const [sections, setSections] = useState([]); // [{title, lessons:[{title,duration,video}]}]

  // ✨ lưu snapshot ban đầu để so sánh/khôi phục
  const [initialData, setInitialData] = useState(null);

  // ✨ cờ “bẩn” – có thay đổi chưa lưu
  const dirty = useMemo(() => {
    const snapshot = { videoDemo, sections };
    return JSON.stringify(snapshot) !== JSON.stringify(initialData);
  }, [videoDemo, sections, initialData]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/courses/${id}`);

        setTitle(data?.title || "");
        const vd = data?.videoDemo || data?.demoVideo || data?.introVideo || "";
        setVideoDemo(vd);

        const rawSections =
          (Array.isArray(data?.sections) && data.sections) ||
          (Array.isArray(data?.curriculum) && data.curriculum) ||
          (Array.isArray(data?.outline) && data.outline) ||
          [];

        const normalized = rawSections.map((sec, sIdx) => ({
          title: sec?.title || sec?.name || `Chương ${sIdx + 1}`,
          lessons: Array.isArray(sec?.lessons)
            ? sec.lessons.map((ls, lIdx) => ({
                title: ls?.title || ls?.name || `Bài ${lIdx + 1}`,
                duration: ls?.duration || ls?.time || "",
                video: ls?.video || ls?.videoUrl || ls?.youtube || "",
              }))
            : [],
        }));

        setSections(normalized);
        // ✨ set snapshot ban đầu
        setInitialData({ videoDemo: vd, sections: normalized });
      } catch (e) {
        console.error(e);
        alert("Không tải được khoá học!");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ⚠️ cảnh báo khi đóng tab/refresh nếu có thay đổi
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  /* ====== actions ====== */
  const addSection = () => setSections((s) => [...s, { title: "Chương mới", lessons: [] }]);
  const removeSection = (idx) => setSections((s) => s.filter((_, i) => i !== idx));
  const updateSectionTitle = (idx, v) =>
    setSections((s) => s.map((sec, i) => (i === idx ? { ...sec, title: v } : sec)));

  const addLesson = (sIdx) =>
    setSections((s) =>
      s.map((sec, i) =>
        i === sIdx
          ? {
              ...sec,
              lessons: [...(sec.lessons || []), { title: "Bài mới", duration: "", video: "" }],
            }
          : sec
      )
    );
  const removeLesson = (sIdx, lIdx) =>
    setSections((s) =>
      s.map((sec, i) =>
        i === sIdx
          ? { ...sec, lessons: (sec.lessons || []).filter((_, j) => j !== lIdx) }
          : sec
      )
    );
  const updateLesson = (sIdx, lIdx, field, value) =>
    setSections((s) =>
      s.map((sec, i) =>
        i === sIdx
          ? {
              ...sec,
              lessons: (sec.lessons || []).map((ls, j) =>
                j === lIdx ? { ...ls, [field]: value } : ls
              ),
            }
          : sec
      )
    );

  const cleanLessonVideoInline = (sIdx, lIdx) => {
    setSections((s) =>
      s.map((sec, i) =>
        i === sIdx
          ? {
              ...sec,
              lessons: (sec.lessons || []).map((ls, j) =>
                j === lIdx ? { ...ls, video: toCleanWatchUrl(ls.video) } : ls
              ),
            }
          : sec
      )
    );
  };

  // ✨ Huỷ thay đổi → quay về snapshot ban đầu
  const handleReset = () => {
    if (!dirty) return;
    const ok = window.confirm("Huỷ toàn bộ thay đổi vừa chỉnh?");
    if (!ok) return;
    if (initialData) {
      setVideoDemo(initialData.videoDemo || "");
      setSections(initialData.sections || []);
    }
  };

  // ✨ Quay lại (nếu bẩn thì hỏi)
  const handleBack = () => {
    if (!dirty) {
      navigate(-1);
      return;
    }
    const ok = window.confirm("Bạn có thay đổi chưa lưu. Rời khỏi trang?");
    if (ok) navigate(-1);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const cleanedSections = (sections || []).map((sec, sIdx) => ({
        title: sec?.title || `Chương ${sIdx + 1}`,
        lessons: (sec.lessons || []).map((ls, lIdx) => ({
          title: ls?.title || `Bài ${lIdx + 1}`,
          duration: ls?.duration || "",
          video: toCleanWatchUrl(ls?.video || ""),
        })),
      }));

      await axios.put(`http://localhost:5000/api/courses/${id}/curriculum`, {
        videoDemo: toCleanWatchUrl(videoDemo),
        sections: cleanedSections,
      });

      // cập nhật snapshot sau khi lưu
      setInitialData({ videoDemo: toCleanWatchUrl(videoDemo), sections: cleanedSections });

      alert("Đã lưu outline!");
      navigate("/admin/courses");
    } catch (e) {
      console.error(e);
      alert("Lưu thất bại!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Đang tải...</p>;

  return (
    <div className="p-6 bg-orange-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* thanh hành động */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              title="Quay lại"
            >
              ← Quay lại
            </button>
            {dirty && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                Có thay đổi chưa lưu
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={!dirty}
              className={`px-3 py-2 rounded-lg border ${
                dirty
                  ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Huỷ thay đổi
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-5 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 ${
                saving ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "Đang lưu..." : "Lưu outline"}
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-orange-600 mb-2">
          Chỉnh outline: {title}
        </h1>

        {/* Video demo */}
        <div className="bg-white border border-orange-100 rounded-xl p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link video demo (YouTube)
          </label>
          <input
            value={videoDemo}
            onChange={(e) => setVideoDemo(e.target.value)}
            onBlur={() => setVideoDemo(toCleanWatchUrl(videoDemo))}
            className="w-full border rounded-lg px-3 py-2 border-orange-200 focus:ring-2 focus:ring-orange-300 outline-none"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="bg-white border border-orange-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={sec.title}
                  onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 border-orange-200 focus:ring-2 focus:ring-orange-300 outline-none"
                />
                <button
                  onClick={() => removeSection(sIdx)}
                  className="px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                >
                  Xoá chương
                </button>
              </div>

              <div className="space-y-2">
                {(sec.lessons || []).map((ls, lIdx) => (
                  <div
                    key={lIdx}
                    className="grid md:grid-cols-3 gap-2 border-t pt-3 first:border-t-0"
                  >
                    <input
                      value={ls.title}
                      onChange={(e) => updateLesson(sIdx, lIdx, "title", e.target.value)}
                      className="border rounded-lg px-3 py-2 border-orange-200 focus:ring-2 focus:ring-orange-300 outline-none"
                      placeholder="Tiêu đề bài"
                    />
                    <input
                      value={ls.duration || ""}
                      onChange={(e) => updateLesson(sIdx, lIdx, "duration", e.target.value)}
                      className="border rounded-lg px-3 py-2 border-orange-200 focus:ring-2 focus:ring-orange-300 outline-none"
                      placeholder="Thời lượng (vd: 07:30)"
                    />
                    <div className="flex gap-2">
                      <input
                        value={ls.video || ""}
                        onChange={(e) => updateLesson(sIdx, lIdx, "video", e.target.value)}
                        onBlur={() => cleanLessonVideoInline(sIdx, lIdx)}
                        className="flex-1 border rounded-lg px-3 py-2 border-orange-200 focus:ring-2 focus:ring-orange-300 outline-none"
                        placeholder="Link YouTube (watch/youtu.be/shorts...)"
                      />
                      <button
                        onClick={() => removeLesson(sIdx, lIdx)}
                        className="px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addLesson(sIdx)}
                className="mt-3 px-3 py-2 rounded-lg bg-white border border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                + Thêm bài học
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={addSection}
            className="px-4 py-2 rounded-lg bg-white border border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            + Thêm chương
          </button>
        </div>
      </div>
    </div>
  );
}
