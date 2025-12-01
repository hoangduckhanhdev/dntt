import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Folder,
  Settings,
  LogOut,
  Menu,
  User,
  Bell,
  ClipboardList,
  Database,       // Ngân hàng câu hỏi
  MessageCircle,  // LearnFeed
  Brain,          // 🧠 Quản lý kỹ năng
  MessagesSquare  // 💬 Phòng học nhóm
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import adminNotificationApi from "../../api/adminNotificationApi";
import { getSocket } from "../../hooks/useSocket";

const MenuItem = ({ to, icon: Icon, label, sidebarOpen, badge = 0 }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      `relative flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
       ${
         isActive
           ? "bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-md"
           : "text-gray-700 hover:bg-orange-100 hover:text-orange-600"
       }`
    }
  >
    <div className="relative">
      <Icon size={20} />
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold w-4 h-4 flex items-center justify-center rounded-full">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </div>
    {sidebarOpen && <span>{label}</span>}
  </NavLink>
);

export default function SidebarAdmin() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [role, setRole] = useState(null); // "admin" | "teacher"
  const navigate = useNavigate();

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u || (u.role !== "admin" && u.role !== "teacher")) {
      navigate("/login");
    } else {
      setRole(u.role);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const fetchUnread = async () => {
    try {
      const res = await adminNotificationApi.getUnreadCount();
      setUnreadCount(res?.unread || res?.count || 0);
    } catch (err) {
      console.error("Lỗi khi lấy số lượng thông báo chưa đọc:", err);
    }
  };

  useEffect(() => {
    fetchUnread();
    const socket = getSocket();
    socket.on("notification:new", () => {
      setUnreadCount((prev) => prev + 1);
    });
    return () => socket.off("notification:new");
  }, []);

  return (
    <aside
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-gradient-to-b from-orange-50 to-amber-50 text-gray-800 min-h-screen flex flex-col transition-all duration-300 border-r border-orange-100 sticky top-0 shadow-md`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-orange-100">
        <h2
          className={`text-lg font-bold text-orange-600 tracking-wide transition-all duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0 w-0"
          }`}
        >
          Bảng quản trị
        </h2>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md hover:bg-orange-100 text-orange-600 transition"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-3 py-5 space-y-2">
        {role === "admin" && (
          <MenuItem
            to="/admin"
            icon={LayoutDashboard}
            label="Tổng quan"
            sidebarOpen={sidebarOpen}
          />
        )}

        <MenuItem
          to="/admin/courses"
          icon={BookOpen}
          label="Khóa học"
          sidebarOpen={sidebarOpen}
        />

        <MenuItem
          to="/admin/exams"
          icon={ClipboardList}
          label="Đề thi"
          sidebarOpen={sidebarOpen}
        />

        <MenuItem
          to="/admin/exam-questions"
          icon={Database}
          label="Ngân hàng câu hỏi"
          sidebarOpen={sidebarOpen}
        />

        <MenuItem
          to="/admin/feed"
          icon={MessageCircle}
          label="LearnFeed"
          sidebarOpen={sidebarOpen}
        />

        {/* 💬 Phòng học nhóm: cho cả admin + teacher, đi tới trang admin */}
        {(role === "admin" || role === "teacher") && (
          <MenuItem
            to="/admin/study-rooms"
            icon={MessagesSquare}
            label="Phòng học nhóm"
            sidebarOpen={sidebarOpen}
          />
        )}

        {/* 🧠 Quản lý kỹ năng: cho cả admin + teacher */}
        {(role === "admin" || role === "teacher") && (
          <MenuItem
            to="/admin/skills"
            icon={Brain}
            label="Quản lý kỹ năng"
            sidebarOpen={sidebarOpen}
          />
        )}

        {role === "admin" && (
          <MenuItem
            to="/admin/teachers"
            icon={User}
            label="Giáo viên"
            sidebarOpen={sidebarOpen}
          />
        )}

        {role === "admin" && (
          <>
            <MenuItem
              to="/admin/users"
              icon={Users}
              label="Người dùng"
              sidebarOpen={sidebarOpen}
            />
            <MenuItem
              to="/admin/categories"
              icon={Folder}
              label="Danh mục"
              sidebarOpen={sidebarOpen}
            />
            <MenuItem
              to="/admin/orders"
              icon={ClipboardList}
              label="Đơn hàng"
              sidebarOpen={sidebarOpen}
            />
          </>
        )}

        {(role === "admin" || role === "teacher") && (
          <MenuItem
            to="/admin/blogs"
            icon={FileText}
            label="Blog"
            sidebarOpen={sidebarOpen}
          />
        )}

        <MenuItem
          to="/admin/notifications"
          icon={Bell}
          label="Thông báo"
          sidebarOpen={sidebarOpen}
          badge={unreadCount}
        />

        {role === "admin" && (
          <MenuItem
            to="/admin/profile"
            icon={Settings}
            label="Cài đặt"
            sidebarOpen={sidebarOpen}
          />
        )}
      </nav>

      {/* FOOTER */}
      <div className="px-3 py-4 border-t border-orange-100">
        {sidebarOpen && (
          <div className="text-sm text-gray-500 mb-3">
            Phiên bản: <span className="font-medium text-orange-600">1.0</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-500 hover:text-red-400 w-full transition-colors"
        >
          <LogOut size={18} />
          {sidebarOpen && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
