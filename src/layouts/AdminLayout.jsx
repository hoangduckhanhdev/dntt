import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SidebarAdmin from "../components/admin/SidebarAdmin";
import TopbarAdmin from "../components/admin/TopbarAdmin";
import { getSocket } from "../hooks/useSocket";
import adminNotificationApi from "../api/adminNotificationApi";
export default function AdminLayout() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); 
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (!role || (role !== "admin" && role !== "teacher")) {
      alert("Bạn không có quyền truy cập trang quản trị!");
      navigate("/login");
    }
  }, [role, navigate]);
  const fetchUnread = async () => {
    try {
      const res = await adminNotificationApi.getAll(); 
      const notifications = Array.isArray(res)
        ? res
        : res.notifications || []; 
      const count = notifications.filter((n) => !n.isRead).length;
      setUnreadCount(count);
    } catch (err) {
      console.error("Lỗi khi lấy thông báo:", err);
    }
  };
  useEffect(() => {
    fetchUnread();
  }, []);
  useEffect(() => {
    const socket = getSocket();
    socket.on("notification:new", (notif) => {
      console.log("🔔 Thông báo mới:", notif.title);
      setUnreadCount((prev) => prev + 1);
      document.title = "🔔 Có thông báo mới!";
      setTimeout(() => {
        document.title = "Trang quản trị";
      }, 2000);
    });
    return () => {
      socket.off("notification:new");
    };
  }, []);
  return (
    <div className="flex min-h-screen bg-orange-50 text-gray-800">
      {}
      <SidebarAdmin />
      {}
      <div className="flex-1 flex flex-col">
        {}
        <TopbarAdmin
          title="Trang quản trị"
          unreadCount={unreadCount}
          onClickBell={() => navigate("/admin/notifications")}
        />
        {}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
