// src/api/adminStudyRoomApi.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// 👉 Gọi đúng endpoint backend: /api/admin/study-rooms
const api = axios.create({
  baseURL: `${API_BASE}/api/admin/study-rooms`,
});

// Gắn token JWT
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
});

const handleError = (err) => {
  const status = err.response?.status;
  const data = err.response?.data || {};
  console.error("❌ adminStudyRoomApi error:", {
    status,
    data,
    url: err.config?.url,
    method: err.config?.method,
  });

  throw {
    status,
    message: data.message || data.error || "Có lỗi khi gọi API phòng học nhóm",
  };
};

const adminStudyRoomApi = {
  // Lấy danh sách phòng (cho admin + teacher)
  async getRooms() {
    try {
      const res = await api.get("/"); // GET /api/admin/study-rooms/
      const payload = res.data;

      // Hỗ trợ cả 2 kiểu: { rooms: [...] } hoặc [...]
      if (Array.isArray(payload)) return { rooms: payload };
      return {
        rooms: payload.rooms || [],
      };
    } catch (err) {
      return handleError(err);
    }
  },

  // Lấy chi tiết 1 phòng
  async getRoom(roomId) {
    try {
      const res = await api.get(`/${roomId}`);
      return res.data;
    } catch (err) {
      return handleError(err);
    }
  },

  // Cập nhật phòng
  async updateRoom(roomId, payload) {
    try {
      const res = await api.put(`/${roomId}`, payload);
      return res.data;
    } catch (err) {
      return handleError(err);
    }
  },

  // Xoá phòng
  async deleteRoom(roomId) {
    try {
      const res = await api.delete(`/${roomId}`);
      return res.data;
    } catch (err) {
      return handleError(err);
    }
  },
};

export default adminStudyRoomApi;
