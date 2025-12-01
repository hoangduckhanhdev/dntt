import React, { useEffect, useState, useRef } from "react";
import { Bell, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import adminNotificationApi from "../../api/adminNotificationApi";
import { getSocket } from "../../hooks/useSocket";

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  // 🔹 Kiểm tra token tồn tại
  const hasToken = () => !!localStorage.getItem("token");

  // 🔹 Lấy danh sách thông báo
  const fetchNotifications = async () => {
    if (!hasToken()) return; // chưa đăng nhập thì không gọi API
    try {
      setLoading(true);
      const data = await adminNotificationApi.getAll();
      const list = res?.data || [];
      const unread = data.filter((n) => !n.isRead).length;

      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(unread);
    } catch (err) {
      console.error("❌ Lỗi khi lấy thông báo:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Khi load component
  useEffect(() => {
    fetchNotifications();
    const socket = getSocket();

    // 📩 Nhận thông báo realtime
    socket.on("notification:new", (notif) => {
      Swal.fire({
        title: "🔔 Thông báo mới!",
        text: notif.title,
        icon: "info",
        timer: 2500,
        showConfirmButton: false,
      });

      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => socket.off("notification:new");
  }, []);

  // 🔹 Click ngoài -> đóng popup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔹 Mở popup -> đánh dấu tất cả là đã đọc
  const handleToggle = async () => {
    const nextState = !open;
    setOpen(nextState);

    if (nextState && unreadCount > 0) {
      try {
        await adminNotificationApi.markAllRead();
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (err) {
        console.error("❌ Lỗi mark-all-read:", err);
        Swal.fire("Lỗi!", "Không thể đánh dấu đã đọc.", "error");
      }
    }
  };

  return (
    <div className="relative" ref={notifRef}>
      {/* Nút chuông */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-orange-100 transition"
      >
        <Bell className="text-orange-500" size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popup danh sách thông báo */}
      {open && (
        <div className="absolute right-0 mt-3 w-96 bg-white shadow-2xl rounded-xl border border-orange-100 z-50 overflow-hidden animate-fadeIn">
          <div className="p-3 border-b border-orange-100 font-semibold text-gray-700 bg-orange-50 flex items-center justify-between">
            <span>🔔 Thông báo gần đây</span>
            <span className="text-xs text-gray-500">{notifications.length} mục</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="animate-spin mr-2" /> Đang tải...
            </div>
          ) : notifications.length === 0 ? (
            <p className="p-4 text-center text-gray-500">Không có thông báo mới</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-orange-100">
              {notifications.map((n) => (
                <li
                  key={n._id}
                  className={`p-3 hover:bg-orange-50 transition cursor-pointer ${
                    n.isRead ? "bg-white" : "bg-orange-50"
                  }`}
                  onClick={() => {
                    if (n.link) window.location.href = n.link;
                    setOpen(false);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{n.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="text-[10px] text-orange-500 font-semibold">
                        Mới
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString("vi-VN")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
