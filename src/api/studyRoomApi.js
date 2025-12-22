import axios from "axios";
import { API_URL } from "./config";

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const studyRoomApi = {
  async getMyRooms() {
    const res = await axios.get(`${API_URL}/study-rooms/my`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return res.data.rooms;
  },

  async createRoom(payload) {
    const safePayload = {
      name: (payload?.name || "").trim(),
      courseId: payload?.courseId || null,
      lessonName: (payload?.lessonName || "").trim(),
      isPublic: !!payload?.isPublic,
    };

    const res = await axios.post(`${API_URL}/study-rooms`, safePayload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return res.data.room;
  },

  async getRoomMessages(roomId) {
    const res = await axios.get(`${API_URL}/study-rooms/${roomId}/messages`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return res.data.messages;
  },

  async getCourseById(courseId) {
    const res = await axios.get(`${API_URL}/courses/${courseId}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return res.data.course || res.data;
  },
};

export default studyRoomApi;
