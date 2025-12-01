// src/pages/admin/AdminSkillList.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminSkillList() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [skills, setSkills] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // import file cho Skill Map
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // form state (dùng chung cho tạo + sửa)
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    level: "intermediate",
    order: 0,
    parentSkill: "",
  });

  /* ================== LOAD COURSES ================== */
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${API_BASE}/admin/courses`, {
          headers: getAuthHeaders(),
        });

        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.courses)
          ? raw.courses
          : Array.isArray(raw?.data)
          ? raw.data
          : [];

        setCourses(list);

        // chọn sẵn course đầu tiên
        if (list.length && !selectedCourseId) {
          setSelectedCourseId(list[0]._id);
        }
      } catch (err) {
        console.error("Load courses error:", err);
        alert("Không tải được danh sách khoá học");
        setCourses([]);
      }
    };

    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================== LOAD SKILLS THEO COURSE ================== */
  const fetchSkills = useCallback(async () => {
    if (!selectedCourseId) {
      setSkills([]);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/admin/skills?course=${selectedCourseId}`,
        { headers: getAuthHeaders() }
      );
      setSkills(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Load skills error:", err);
      alert("Không tải được danh sách kỹ năng");
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchSkills();
    }
  }, [selectedCourseId, fetchSkills]);

  /* ================== HANDLERS ================== */
  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      level: "intermediate",
      order: 0,
      parentSkill: "",
    });
  };

  const handleEdit = (skill) => {
    setEditingId(skill._id);
    setForm({
      name: skill.name || "",
      description: skill.description || "",
      level: skill.level || "intermediate",
      order: skill.order ?? 0,
      parentSkill: skill.parentSkill || "",
    });
  };

  const handleDelete = async (skillId) => {
    if (!window.confirm("Xoá kỹ năng này? Các kỹ năng con sẽ được tách ra.")) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/admin/skills/${skillId}`, {
        headers: getAuthHeaders(),
      });
      setSkills((prev) => prev.filter((s) => s._id !== skillId));
    } catch (err) {
      console.error("Delete skill error:", err);
      alert("Xoá skill thất bại");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert("Hãy chọn khoá học trước");
      return;
    }
    if (!form.name.trim()) {
      alert("Tên kỹ năng không được bỏ trống");
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        // UPDATE
        const res = await axios.put(
          `${API_BASE}/admin/skills/${editingId}`,
          {
            name: form.name,
            description: form.description,
            level: form.level,
            order: Number(form.order) || 0,
            parentSkill: form.parentSkill || null,
          },
          { headers: getAuthHeaders() }
        );

        const updated = res.data;
        setSkills((prev) =>
          prev.map((s) => (s._id === updated._id ? updated : s))
        );
      } else {
        // CREATE
        const res = await axios.post(
          `${API_BASE}/admin/skills`,
          {
            course: selectedCourseId,
            name: form.name,
            description: form.description,
            level: form.level,
            order: Number(form.order) || 0,
            parentSkill: form.parentSkill || null,
          },
          { headers: getAuthHeaders() }
        );
        setSkills((prev) => [...prev, res.data]);
      }

      resetForm();
    } catch (err) {
      console.error("Save skill error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Lưu skill thất bại, kiểm tra lại backend.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  // ========== IMPORT SKILL MAP TỪ FILE ==========
  const handleImport = async () => {
    if (!selectedCourseId) {
      alert("Hãy chọn khoá học trước khi import Skill Map.");
      return;
    }
    if (!importFile) {
      alert("Vui lòng chọn file Excel hoặc CSV.");
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("course", selectedCourseId);

      const res = await axios.post(
        `${API_BASE}/admin/skills/import`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const imported =
        res?.data?.items && Array.isArray(res.data.items)
          ? res.data.items
          : Array.isArray(res?.data)
          ? res.data
          : [];

      if (imported.length) {
        // load lại từ server cho chắc
        await fetchSkills();
        alert(`Đã import thành công ${imported.length} kỹ năng.`);
      } else {
        await fetchSkills();
        alert("Import hoàn tất (không rõ số lượng, vui lòng kiểm tra danh sách).");
      }

      setImportFile(null);
    } catch (err) {
      console.error("Import Skill Map error:", err?.response?.data || err);
      alert(
        err?.response?.data?.message ||
          "Import Skill Map thất bại. Kiểm tra lại cấu trúc file & backend."
      );
    } finally {
      setImporting(false);
    }
  };

  // helper hiển thị tên nhóm
  const getParentName = (id) => {
    if (!id) return "-";
    const s = skills.find((x) => x._id === id);
    return s ? s.name : "(đã xoá)";
  };

  /* ================== RENDER ================== */
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            🧠 Bản đồ kỹ năng (Skill Map)
          </h1>
          <p className="text-sm text-slate-500">
            Gắn kỹ năng cho từng khoá học để AI phân tích bài test &amp; gợi ý
            lộ trình học cá nhân.
          </p>
        </div>
      </div>

      {/* Chọn khoá học */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <span className="text-sm font-semibold text-slate-700">
          Khoá học:
        </span>
        <select
          className="border rounded-lg px-3 py-2 text-sm min-w-[260px]"
          value={selectedCourseId}
          onChange={(e) => {
            setSelectedCourseId(e.target.value);
            resetForm();
          }}
        >
          {(!courses || courses.length === 0) && (
            <option value="">(Chưa có khoá học)</option>
          )}
          {Array.isArray(courses) &&
            courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
        </select>
      </div>

      {/* Layout 2 cột: form + bảng */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM + IMPORT */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-soft border p-4">
          <h2 className="text-base font-semibold mb-3">
            {editingId ? "✏️ Sửa kỹ năng" : "➕ Thêm kỹ năng mới"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Tên kỹ năng *
              </label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="VD: Kỹ năng nghe, Ngữ pháp thì hiện tại đơn..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Mô tả ngắn
              </label>
              <textarea
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Giải thích ngắn về kỹ năng này…"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1">
                  Mức độ
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.level}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, level: e.target.value }))
                  }
                >
                  <option value="beginner">Người mới bắt đầu</option>
                  <option value="intermediate">Trung cấp</option>
                  <option value="advanced">Nâng cao</option>
                </select>
              </div>
              <div className="w-24">
                <label className="block text-xs font-semibold mb-1">
                  Thứ tự
                </label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={form.order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, order: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Skill cha (nhóm)
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.parentSkill}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parentSkill: e.target.value }))
                }
              >
                <option value="">(Không có)</option>
                {skills
                  .filter((s) => !editingId || s._id !== editingId)
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving || !selectedCourseId}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60"
              >
                {saving
                  ? "Đang lưu..."
                  : editingId
                  ? "Cập nhật kỹ năng"
                  : "Thêm kỹ năng"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 rounded-lg border text-sm"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>

          {/* IMPORT BLOCK */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-700 mb-2">
              Hoặc import Skill Map từ file Excel / CSV
            </h3>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="text-xs"
                onChange={(e) =>
                  setImportFile(e.target.files && e.target.files[0]
                    ? e.target.files[0]
                    : null)
                }
                disabled={!selectedCourseId || importing}
              />
              <button
                type="button"
                onClick={handleImport}
                disabled={!importFile || !selectedCourseId || importing}
                className="px-3 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 self-start"
              >
                {importing ? "Đang import..." : "Import Skill Map"}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
              Gợi ý cấu trúc file: <br />
              <code>name | description | level (beginner/intermediate/advanced) | order</code>
              <br />
              Mỗi dòng là một kỹ năng. Backend sẽ tự map các cột này vào cơ sở dữ liệu.
            </p>
          </div>
        </div>

        {/* TABLE */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-soft border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">
              Danh sách kỹ năng ({skills.length})
            </h2>
            {loading && (
              <span className="text-xs text-slate-400">Đang tải...</span>
            )}
          </div>

          {skills.length === 0 ? (
            <p className="text-sm text-slate-500">
              Chưa có kỹ năng nào cho khoá học này.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-600">
                    <th className="px-3 py-2 text-left">Tên kỹ năng</th>
                    <th className="px-3 py-2 text-left">Nhóm</th>
                    <th className="px-3 py-2 text-left">Mức độ</th>
                    <th className="px-3 py-2 text-left">Thứ tự</th>
                    <th className="px-3 py-2 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {skills
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((s) => (
                      <tr
                        key={s._id}
                        className="border-t border-slate-100 hover:bg-slate-50/60"
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="font-semibold text-slate-800">
                            {s.name}
                          </div>
                          {s.description && (
                            <div className="text-xs text-slate-500 line-clamp-2">
                              {s.description}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-slate-600">
                          {getParentName(s.parentSkill)}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-slate-600">
                          {s.level || "intermediate"}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-slate-600">
                          {s.order ?? 0}
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <button
                            onClick={() => handleEdit(s)}
                            className="px-2 py-1 text-xs rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 mr-1"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="px-2 py-1 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Xoá
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
