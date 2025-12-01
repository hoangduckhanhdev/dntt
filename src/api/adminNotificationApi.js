// src/api/adminNotificationApi.js
import axios from "axios";
import { ADMIN_API_URL } from "./config";

// 👉 Base URL chính xác: https://hkcode.onrender.com/api/admin/notifications
const API = axios.create({
  baseURL: `${ADMIN_API_URL}/notifications`,
});

// ===================== 🔐 INTERCEPTORS 🔐 ===================== //

// Gắn token vào header
API.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Bắt lỗi 401: TOKEN_EXPIRED → xoá token + chuyển về login
API.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const code = data?.code;
    const msg = data?.message || data?.error || "";

    if (
      status === 401 &&
      (code === "TOKEN_EXPIRED" || (typeof msg === "string" && msg.includes("jwt expired")))
    ) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
      } catch (e) {}
      window.location.href = "/login?expired=1";
    }

    return Promise.reject(error);
  }
);

// ===================== ❌ XỬ LÝ LỖI CHUNG ❌ ===================== //

const handleError = (err) => {
  const status = err.response?.status;
  const data = err.response?.data || { message: "Unknown error" };
  const url = err.config?.url;
  const method = err.config?.method;

  console.error("❌ API Notification Error:", {
    status,
    data,
    url: `${API.defaults.baseURL}${url || ""}`,
    method,
  });

  const message =
    data.error ||
    data.message ||
    `NOTIFICATION_API_ERROR_${status || "UNKNOWN"}`;

  // Ném Error chuẩn để chỗ gọi có thể .message
  throw new Error(message);
};

/**
 * 🔹 Lấy danh sách thông báo:
 *  - Admin  -> gọi /all  (xem toàn hệ thống)
 *  - Teacher -> gọi /    (chỉ xem thông báo của chính mình)
 */
const getAll = async () => {
  try {
    // Lưu ý: tuỳ bạn đang lưu user ở key nào (user hay userInfo)
    const userRaw =
      localStorage.getItem("user") || localStorage.getItem("userInfo");
    const user = userRaw ? JSON.parse(userRaw) : null;
    const role = user?.role;

    const url = role === "admin" ? "/all" : "/"; // admin cũng xem được "/"
    const res = await API.get(url);

    const payload = res.data;
    return payload.data || payload;
  } catch (err) {
    return handleError(err);
  }
};

// 🔹 Lấy thông báo của chính user (nếu muốn dùng riêng)
const getMine = async () => {
  try {
    const res = await API.get("/");
    const payload = res.data;
    return payload.data || payload;
  } catch (err) {
    return handleError(err);
  }
};

// 🔹 Đếm thông báo chưa đọc (admin + teacher đều dùng được)
const getUnreadCount = async () => {
  try {
    const res = await API.get("/unread-count");
    // controller trả { success, unread: number }
    return res.data;
  } catch (err) {
    return handleError(err);
  }
};

// 🔹 Tạo thông báo mới (admin)
const create = async (data) => {
  try {
    const res = await API.post("/", data);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
};

// 🔹 Cập nhật thông báo (chỉ admin)
const update = async (id, data) => {
  try {
    const res = await API.put(`/${id}`, data);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
};

// 🔹 Đánh dấu 1 thông báo đã đọc (admin + teacher)
const markAsRead = async (id) => {
  try {
    const res = await API.put(`/${id}/read`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
};

// 🔹 Đánh dấu tất cả đã đọc (admin + teacher)
const markAllAsRead = async () => {
  try {
    const res = await API.put("/mark-all-read");
    return res.data;
  } catch (err) {
    return handleError(err);
  }
};

// 🔹 Xoá thông báo (admin)
const remove = async (id) => {
  try {
    const res = await API.delete(`/${id}`);
    return res.data;
  } catch (err) {
    return handleError(err);
  }
};

const adminNotificationApi = {
  getAll,
  getMine,
  getUnreadCount,
  create,
  update,
  markAsRead,
  markAllAsRead,
  remove,
};

export default adminNotificationApi;
