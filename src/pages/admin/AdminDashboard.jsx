import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  FileText,
  Receipt,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
const currency = (n) => `${Number(n || 0).toLocaleString("vi-VN")}₫`;
export default function AdminDashboard() {
  const [role, setRole] = useState(null); 
  const [stats, setStats] = useState({
    users: 0,
    teachers: 0,
    courses: 0,
    blogs: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    todayOrders: 0,
  });
  const [userChart, setUserChart] = useState([]);
  const [revenueDaily, setRevenueDaily] = useState([]);
  const [teacherStats, setTeacherStats] = useState({
    teacherName: "",
    totalMyCourses: 0,
    totalMyStudents: 0,
    latestCourses: [],
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    const r = u?.role || null;
    setRole(r);
    (async () => {
      if (!r) {
        setErr("Bạn chưa đăng nhập hoặc thiếu thông tin quyền.");
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        if (r === "admin") {
          const { data } = await axios.get(
            "http://localhost:5000/api/admin/dashboard",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!data?.success) {
            setErr("Không thể tải dữ liệu từ máy chủ.");
            return;
          }
          const total = data.data?.total || {};
          const charts = data.data?.charts || {};
          setStats({
            users: total.users || 0,
            teachers: total.teachers || 0,
            courses: total.courses || 0,
            blogs: total.blogs || 0,
            totalRevenue: total.totalRevenue || 0,
            todayRevenue: total.todayRevenue || 0,
            todayOrders: total.todayOrders || 0,
          });
          setUserChart(charts.userStats || []);
          setRevenueDaily(charts.revenueDaily || []);
        } else if (r === "teacher") {
          const { data } = await axios.get(
            "http://localhost:5000/api/admin/dashboard/teacher",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!data?.success) {
            setErr("Không thể tải thống kê giáo viên từ máy chủ.");
            return;
          }
          setTeacherStats({
            teacherName: data.teacherName || "Giáo viên",
            totalMyCourses: data.totalMyCourses || 0,
            totalMyStudents: data.totalMyStudents || 0,
            latestCourses: data.latestCourses || [],
          });
        } else {
          setErr("Bạn không có quyền truy cập trang này.");
        }
      } catch (e) {
        console.error("Dashboard error:", e);
        setErr(
          "Lỗi khi tải dữ liệu. Vui lòng đăng nhập lại hoặc kiểm tra server!"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  if (loading) {
    return (
      <div className="p-8">
        <div className="h-10 w-64 rounded-lg bg-orange-100 animate-pulse mb-6" />
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-orange-50 animate-pulse" />
          ))}
        </div>
        <div className="mt-8 h-96 rounded-2xl bg-orange-50 animate-pulse" />
      </div>
    );
  }
  if (err) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {err}
        </div>
      </div>
    );
  }
  if (role === "admin") {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        {}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Trang quản trị</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Bảng điều khiển
            </h1>
          </div>
          <button
            onClick={() => navigate("/admin/orders")}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
          >
            Đơn hàng gần đây <ArrowRight size={16} />
          </button>
        </div>
        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-5">
          <StatCard
            title="Người dùng"
            value={stats.users}
            icon={<Users size={28} />}
            gradient="from-orange-100 to-white"
          />
          <StatCard
            title="Giảng viên"
            value={stats.teachers}
            icon={<Users size={28} />}
            gradient="from-amber-100 to-white"
          />
          <StatCard
            title="Khóa học"
            value={stats.courses}
            icon={<BookOpen size={28} />}
            gradient="from-yellow-100 to-white"
          />
          <StatCard
            title="Bài viết"
            value={stats.blogs}
            icon={<FileText size={28} />}
            gradient="from-lime-100 to-white"
          />
          <StatCard
            title="Doanh thu"
            value={currency(stats.totalRevenue)}
            icon={<Receipt size={28} />}
            gradient="from-rose-100 to-white"
            onClick={() => navigate("/admin/orders")}
          />
          <StatCard
            title="Doanh thu hôm nay"
            value={currency(stats.todayRevenue)}
            sub={`${stats.todayOrders} đơn`}
            icon={<Receipt size={28} />}
            gradient="from-emerald-100 to-white"
            onClick={() => navigate("/admin/orders")}
          />
        </div>
        {}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Panel title="Người dùng mới theo tháng">
            <UsersBarPretty data={userChart} />
          </Panel>
          <Panel
            title="Doanh thu theo ngày (7 ngày gần nhất)"
            right={
              <span className="text-sm text-slate-500">
                Hôm nay:{" "}
                <b className="text-orange-600">
                  {currency(stats.todayRevenue)}
                </b>
              </span>
            }
          >
            <RevenueAreaPretty data={revenueDaily} />
          </Panel>
        </div>
      </div>
    );
  }
  if (role === "teacher") {
    const t = teacherStats;
    return (
      <div className="p-6 lg:p-8 space-y-8">
        {}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Trang giảng viên</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Xin chào, {t.teacherName || "Giáo viên"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Đây là tổng quan các khóa học bạn đang phụ trách. Không hiển thị doanh
              thu toàn hệ thống.
            </p>
          </div>
        </div>
        {}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            title="Khóa học đang dạy"
            value={t.totalMyCourses}
            icon={<BookOpen size={28} />}
            gradient="from-orange-100 to-white"
          />
          <StatCard
            title="Tổng lượt đăng ký (đã thanh toán)"
            value={t.totalMyStudents}
            icon={<Users size={28} />}
            gradient="from-amber-100 to-white"
          />
          <StatCard
            title="Thông báo"
            value="Xem chi tiết"
            sub="Vào mục Thông báo trong menu"
            icon={<FileText size={28} />}
            gradient="from-emerald-100 to-white"
            onClick={() => navigate("/admin/notifications")}
          />
        </div>
        {}
        <Panel title="Khóa học gần đây">
          {(!t.latestCourses || t.latestCourses.length === 0) ? (
            <div className="text-sm text-slate-500 italic">
              Bạn chưa có khóa học nào hoặc chưa được gán làm giảng viên.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-orange-50 text-orange-700">
                    <th className="px-3 py-2 text-left">Tên khóa học</th>
                    <th className="px-3 py-2 text-left">Học viên</th>
                    <th className="px-3 py-2 text-left">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {t.latestCourses.map((c) => (
                    <tr
                      key={c._id}
                      className="border-b last:border-0 hover:bg-orange-50/40"
                    >
                      <td className="px-3 py-2">{c.title}</td>
                      <td className="px-3 py-2">{c.students || 0}</td>
                      <td className="px-3 py-2">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString("vi-VN")
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    );
  }
  return null;
}
function StatCard({ title, value, sub, icon, gradient, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-2xl border border-orange-100 bg-gradient-to-br ${gradient} p-4 shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-xl bg-white text-orange-600 ring-1 ring-orange-100 p-2.5">
          {icon}
        </div>
        <ArrowRight
          size={16}
          className="opacity-0 group-hover:opacity-100 text-orange-500 transition"
        />
      </div>
      <div className="mt-3 text-slate-500 text-sm">{title}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </div>
      {sub ? <div className="text-xs text-slate-500 mt-1">{sub}</div> : null}
    </button>
  );
}
function Panel({ title, right, children }) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}
function EmptyChart() {
  return (
    <div className="h-[320px] grid place-items-center rounded-xl border border-dashed border-orange-200 bg-orange-50/30 text-slate-500">
      <div className="flex items-center gap-2">
        <Loader2 className="animate-spin text-orange-400" size={18} />
        Chưa có dữ liệu hiển thị
      </div>
    </div>
  );
}
function PrettyTooltip({ active, payload, label, money = false }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value || 0;
  return (
    <div className="rounded-xl border border-orange-200 bg-white px-3 py-2 shadow-sm text-sm">
      <div className="font-medium text-slate-700 mb-1">{label}</div>
      <div className="text-orange-600 font-semibold">
        {money ? currency(val) : Number(val).toLocaleString("vi-VN")}
      </div>
    </div>
  );
}
function UsersBarPretty({ data }) {
  if (!data?.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} barSize={28}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="1" />
            <stop offset="100%" stopColor="#fdba74" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" opacity={0.4} />
        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip content={<PrettyTooltip />} />
        <Bar dataKey="users" fill="url(#barGrad)" radius={[10, 10, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
function RevenueAreaPretty({ data }) {
  if (!data?.length) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb923c" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" opacity={0.4} />
        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
        <YAxis
          tickFormatter={(v) =>
            v >= 1_000_000 ? `${v / 1_000_000}m` : `${v / 1000}k`
          }
          tick={{ fill: "#64748b", fontSize: 12 }}
        />
        <Tooltip content={<PrettyTooltip money />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#fb923c"
          strokeWidth={3}
          fill="url(#areaGrad)"
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
