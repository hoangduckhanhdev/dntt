import React, { useEffect, useRef, useState } from "react";
import { FiBell } from "react-icons/fi";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// Lấy config axios có token
const getAuthConfig = () => {
  try {
    const token = localStorage.getItem("token");
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return {
      headers,
      withCredentials: true,
    };
  } catch {
    return { withCredentials: true };
  }
};

export default function FeedNotificationBell() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef(null);

  // ==========================
  // Fetch notifications
  // ==========================
  const fetchNotifications = async () => {
    setErr("");

    // ⛔ Nếu chưa có token thì khỏi gọi API, tránh 401
    const token = localStorage.getItem("token");
    if (!token) {
      setList([]);
      setUnread(0);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/feed/notifications`,
        getAuthConfig()
      );

      const notifications = res.data?.notifications || res.data || [];

      setList(notifications);
      const unreadCount = notifications.filter(
        (n) => !n.readAt && !n.isRead
      ).length;
      setUnread(unreadCount);
    } catch (error) {
      console.error("Load feed notifications error:", error);

      if (error.response?.status === 401) {
        // Token sai / hết hạn → clear và gợi ý đăng nhập lại
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setErr("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
      } else {
        setErr("Không tải được thông báo, vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  // mở dropdown thì load
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // click ngoài thì đóng
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <FiBell className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border z-50">
          <div className="px-4 py-2 border-b flex items-center justify-between">
            <span className="font-semibold text-sm">
              Thông báo hoạt động
            </span>
            {loading && (
              <span className="text-xs text-gray-400">Đang tải...</span>
            )}
          </div>

          {err && (
            <div className="px-4 py-2 text-xs text-red-500">{err}</div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {list.length === 0 && !loading && !err && (
              <div className="px-4 py-4 text-sm text-gray-500">
                Chưa có thông báo nào.
              </div>
            )}

            {list.map((item) => (
              <div
                key={item._id || item.id}
                className={`px-4 py-3 text-sm border-b last:border-b-0 ${
                  !item.readAt && !item.isRead
                    ? "bg-blue-50"
                    : "bg-white"
                }`}
              >
                <div className="font-medium">
                  {item.title || "Hoạt động mới"}
                </div>
                <div className="text-xs text-gray-600">
                  {item.message || item.content}
                </div>
                {item.createdAt && (
                  <div className="mt-1 text-[11px] text-gray-400">
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
