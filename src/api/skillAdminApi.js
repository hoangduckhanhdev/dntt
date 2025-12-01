// src/api/skillAdminApi.js
import axios from "axios";
import { ADMIN_API_URL } from "./config";
// ADMIN_API_URL = `${API_BASE}/api/admin`
// → Local:  http://localhost:5000/api/admin
// → Render: https://hkcode.onrender.com/api/admin

const adminSkillClient = axios.create({
  baseURL: ADMIN_API_URL,
});

// Thêm token vào request
adminSkillClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const skillAdminApi = {
  /* ===========================
     GET SKILLS BY COURSE
     GET /api/admin/skills?course=...
  ============================= */
  getSkills: async (courseId) => {
    const res = await adminSkillClient.get("/skills", {
      params: { course: courseId },
    });
    return res.data;
  },

  /* ===========================
     CREATE
     POST /api/admin/skills
  ============================= */
  createSkill: async (payload) => {
    const res = await adminSkillClient.post("/skills", payload);
    return res.data;
  },

  /* ===========================
     UPDATE
     PUT /api/admin/skills/:id
  ============================= */
  updateSkill: async (id, payload) => {
    const res = await adminSkillClient.put(`/skills/${id}`, payload);
    return res.data;
  },

  /* ===========================
     DELETE
     DELETE /api/admin/skills/:id
  ============================= */
  deleteSkill: async (id) => {
    const res = await adminSkillClient.delete(`/skills/${id}`);
    return res.data;
  },

  /* ===========================
     IMPORT SKILL MAP (Excel)
     POST /api/admin/skills/import
  ============================= */
  importSkills: async (courseId, file) => {
    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("file", file);

    const res = await adminSkillClient.post("/skills/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  },

  /* ===========================
     REORDER SKILLS (Drag–Drop)
     POST /api/admin/skills/reorder/list
  ============================= */
  reorderSkills: async (items) => {
    const res = await adminSkillClient.post("/skills/reorder/list", {
      items,
    });
    return res.data;
  },
};

export default skillAdminApi;
