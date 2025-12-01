// src/pages/admin/AdminCourseSkillMapEditor.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import skillAdminApi from "../../api/skillAdminApi";

export default function AdminCourseSkillMapEditor() {
  const { courseId } = useParams();

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [editing, setEditing] = useState(null); // null = tạo mới
  const [form, setForm] = useState({
    name: "",
    description: "",
    level: "intermediate",
    parentSkill: "",
    order: 0,
  });

  // load skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await skillAdminApi.getSkills(courseId);
        setSkills(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("Không tải được danh sách kỹ năng.");
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchSkills();
  }, [courseId]);

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      level: "intermediate",
      parentSkill: "",
      order: 0,
    });
  };

  const handleEdit = (skill) => {
    setEditing(skill);
    setForm({
      name: skill.name || "",
      description: skill.description || "",
      level: skill.level || "intermediate",
      parentSkill: skill.parentSkill || "",
      order: skill.order || 0,
    });
  };

  const handleDelete = async (skill) => {
    if (!window.confirm(`Xoá kỹ năng "${skill.name}"?`)) return;
    try {
      await skillAdminApi.deleteSkill(skill._id);
      setSkills((prev) => prev.filter((s) => s._id !== skill._id));
    } catch (e) {
      console.error(e);
      alert("Xoá skill thất bại");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Tên kỹ năng không được để trống");
      return;
    }

    const payload = {
      course: courseId,
      name: form.name,
      description: form.description,
      level: form.level,
      parentSkill: form.parentSkill || null,
      order: Number(form.order) || 0,
    };

    try {
      if (editing) {
        const updated = await skillAdminApi.updateSkill(editing._id, payload);
        setSkills((prev) =>
          prev.map((s) => (s._id === updated._id ? updated : s))
        );
      } else {
        const created = await skillAdminApi.createSkill(payload);
        setSkills((prev) => [...prev, created]);
      }
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Lưu skill thất bại");
    }
  };

  // build tree cho phần hiển thị
  const tree = useMemo(() => {
    const map = {};
    skills.forEach((s) => {
      map[s._id] = { ...s, children: [] };
    });

    const roots = [];
    skills.forEach((s) => {
      if (s.parentSkill) {
        const parent = map[s.parentSkill];
        if (parent) parent.children.push(map[s._id]);
        else roots.push(map[s._id]);
      } else {
        roots.push(map[s._id]);
      }
    });

    const sortTree = (nodes) => {
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
      nodes.forEach((n) => sortTree(n.children));
    };
    sortTree(roots);

    return roots;
  }, [skills]);

  const levelBadge = (level) => {
    switch (level) {
      case "advanced":
        return (
          <span className="text-[10px] px-2 py-[2px] rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            Nâng cao
          </span>
        );
      case "beginner":
        return (
          <span className="text-[10px] px-2 py-[2px] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Cơ bản
          </span>
        );
      case "intermediate":
      default:
        return (
          <span className="text-[10px] px-2 py-[2px] rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Trung cấp
          </span>
        );
    }
  };

  const SkillNodeRow = ({ node, depth = 0 }) => {
    return (
      <>
        <tr>
          <td className="py-1 text-xs text-slate-600">
            <div className="flex items-center">
              <div style={{ width: depth * 16 }} />
              {depth > 0 && (
                <span className="mr-1 text-slate-300">↳</span>
              )}
              <span className="font-medium">{node.name}</span>
            </div>
          </td>
          <td className="py-1 text-xs text-slate-500 max-w-xs">
            {node.description}
          </td>
          <td className="py-1 text-xs">{levelBadge(node.level)}</td>
          <td className="py-1 text-xs text-center">{node.order || 0}</td>
          <td className="py-1 text-right text-xs">
            <button
              onClick={() => handleEdit(node)}
              className="px-2 py-1 mr-1 rounded border text-[11px] text-slate-600 hover:bg-slate-50"
            >
              Sửa
            </button>
            <button
              onClick={() => handleDelete(node)}
              className="px-2 py-1 rounded border border-red-200 text-[11px] text-red-600 hover:bg-red-50"
            >
              Xoá
            </button>
          </td>
        </tr>
        {node.children &&
          node.children.map((child) => (
            <SkillNodeRow key={child._id} node={child} depth={depth + 1} />
          ))}
      </>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            🧠 Quản lý Skill Map khoá học
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thiết kế bản đồ kỹ năng dạng sơ đồ tư duy: tạo skill cha/con, sắp
            xếp thứ tự và gán level.
          </p>
        </div>
        <Link
          to={`/course/${courseId}`}
          className="text-xs text-orange-600 hover:underline"
        >
          ⬅ Quay lại khoá học
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Bảng tree skill */}
        <div className="col-span-7 bg-white border rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Cấu trúc kỹ năng
            </h2>
            {loading && (
              <span className="text-[11px] text-gray-500">
                Đang tải...
              </span>
            )}
          </div>

          {err && (
            <div className="text-xs text-red-500 mb-2">{err}</div>
          )}

          {!skills.length && !loading ? (
            <p className="text-xs text-gray-500">
              Chưa có kỹ năng nào. Hãy tạo skill đầu tiên ở form bên phải.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-[11px] text-slate-500">
                    <th className="py-1 pr-2">Tên kỹ năng</th>
                    <th className="py-1 pr-2">Mô tả</th>
                    <th className="py-1 pr-2">Level</th>
                    <th className="py-1 pr-2 text-center">Thứ tự</th>
                    <th className="py-1 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {tree.map((root) => (
                    <SkillNodeRow key={root._id} node={root} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form tạo / sửa skill */}
        <div className="col-span-5 bg-white border rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            {editing ? "Chỉnh sửa kỹ năng" : "Tạo kỹ năng mới"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Tên kỹ năng *
              </label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Mô tả (ngắn)
              </label>
              <textarea
                rows={2}
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Level
                </label>
                <select
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.level}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, level: e.target.value }))
                  }
                >
                  <option value="beginner">Beginner (Cơ bản)</option>
                  <option value="intermediate">
                    Intermediate (Trung cấp)
                  </option>
                  <option value="advanced">Advanced (Nâng cao)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, order: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Kỹ năng cha (tuỳ chọn)
              </label>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
                value={form.parentSkill || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    parentSkill: e.target.value || "",
                  }))
                }
              >
                <option value="">— Không có (skill gốc) —</option>
                {skills.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center pt-2">
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Hủy chỉnh sửa, tạo mới
                </button>
              )}

              <button
                type="submit"
                className="ml-auto px-4 py-2 rounded bg-orange-500 text-white text-sm hover:bg-orange-600"
              >
                {editing ? "Cập nhật" : "Tạo skill"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
