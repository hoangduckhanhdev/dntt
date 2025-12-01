// src/api/studyRoomApi.js
import axios from "axios";
import { API_URL } from "./config";
// API_URL = `${API_BASE}/api`
// Local  → http://localhost:5000/api
// Render → https://hkcode.onrender.com/api

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const studyRoomApi = {
  // Lấy danh sách phòng của user hiện tại
  async getMyRooms() {
    const res = await axios.get(`${API_URL}/study-rooms/my`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return res.data.rooms;
  },

  // Tạo phòng học nhóm mới
  async createRoom(payload) {
    const res = await axios.post(`${API_URL}/study-rooms`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return res.data.room;
  },

  // Lấy lịch sử tin nhắn của 1 phòng
  async getRoomMessages(roomId) {
    const res = await axios.get(`${API_URL}/study-rooms/${roomId}/messages`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return res.data.messages;
  },
};

export default studyRoomApi;
