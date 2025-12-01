import React, { useEffect, useRef, useState } from "react";
import { FiBell } from "react-icons/fi";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// Lấy config axios có token
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

export default function FeedNotificationBell() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/feed/notifications`,
        getAuthConfig()
      );
      const data = res.data || [];
      setList(data);
      setUnread(data.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Load feed notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  // load lần đầu
  useEffect(() => {
    fetchNotifications();
  }, []);

  // mở dropdown lần đầu thì đánh dấu đã đọc
  const handleToggle = async () => {
    const next = !open;
    setOpen(next);

    if (next && unread > 0) {
      try {
        await axios.patch(
          `${API_BASE}/feed/notifications/read-all`,
          {},
          getAuthConfig()
        );
        setUnread(0);
        // local update
        setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (err) {
        console.error("read-all notifications error:", err);
      }
    }
  };

  const renderText = (n) => {
    const actor = n.actor?.name || "Ai đó";
    if (n.type === "like") return `${actor} đã thích bài viết của bạn`;
    if (n.type === "comment") return `${actor} đã bình luận bài viết của bạn`;
    return `${actor} có hoạt động mới trên bài viết của bạn`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-orange-50 transition"
      >
        <FiBell className="text-orange-500" size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-lg z-40 text-sm">
          <div className="px-3 py-2 border-b bg-orange-50/60 rounded-t-2xl flex items-center justify-between">
            <span className="font-semibold text-slate-800">
              Thông báo LearnFeed
            </span>
            <button
              onClick={fetchNotifications}
              className="text-[11px] text-orange-600 hover:underline"
            >
              Làm mới
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="px-3 py-3 text-xs text-slate-500">
                Đang tải...
              </div>
            )}

            {!loading && list.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500">
                Chưa có thông báo nào.
              </div>
            )}

            {!loading &&
              list.map((n) => (
                <div
                  key={n._id}
                  className={`px-3 py-2.5 border-b last:border-b-0 cursor-default ${
                    n.isRead ? "bg-white" : "bg-orange-50/40"
                  }`}
                >
                  <div className="flex gap-2">
                    <img
                      src={n.actor?.avatar || "/default-avatar.png"}
                      alt=""
                      className="w-7 h-7 rounded-full bg-slate-100 object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-[13px] text-slate-800">
                        {renderText(n)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
