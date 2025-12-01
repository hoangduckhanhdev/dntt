// src/api/studyRoomApi.js
import axios from "axios";

// Giống pattern các trang khác: CourseLearn dùng "http://localhost:5000"
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getAuthHeader() {
  const token = localStorage.getItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

const studyRoomApi = {
  // Lấy danh sách phòng của user hiện tại
  async getMyRooms() {
    const res = await axios.get(`${API_BASE}/api/study-rooms/my`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return res.data.rooms;
  },

  // Tạo phòng học nhóm mới
  async createRoom(payload) {
    const res = await axios.post(`${API_BASE}/api/study-rooms`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return res.data.room;
  },

  // Lấy lịch sử tin nhắn của 1 phòng
  async getRoomMessages(roomId) {
    const res = await axios.get(
      `${API_BASE}/api/study-rooms/${roomId}/messages`,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      }
    );
    return res.data.messages;
  },
};

export default studyRoomApi;
