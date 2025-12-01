// src/api/feedNotificationApi.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const getAuthConfig = () => {
  try {
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return { headers, withCredentials: true };
  } catch {
    return { withCredentials: true };
  }
};

const feedNotificationApi = {
  async list() {
    const res = await axios.get(
      `${API_BASE}/feed/notifications`,
      getAuthConfig()
    );
    return res.data || [];
  },

  async read(id) {
    const res = await axios.patch(
      `${API_BASE}/feed/notifications/${id}/read`,
      {},
      getAuthConfig()
    );
    return res.data;
  },

  async readAll() {
    const res = await axios.patch(
      `${API_BASE}/feed/notifications/read-all`,
      {},
      getAuthConfig()
    );
    return res.data;
  },
};

export default feedNotificationApi;
