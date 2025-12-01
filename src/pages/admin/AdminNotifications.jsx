// src/pages/admin/AdminNotifications.jsx
import React, { useEffect, useState } from "react";
import {
  Bell,
  Trash2,
  CheckCircle2,
  Edit2,
  PlusCircle,
  Filter,
  Send,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import adminNotificationApi from "../../api/adminNotificationApi";
import axios from "axios";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [form, setForm] = useState({
    title: "",
    message: "",
    target: "",
    priority: "normal",
    image: "",
    scheduleAt: "",
  });
  const [uploading, setUploading] = useState(false);

  // 🔹 Lấy danh sách thông báo
  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await adminNotificationApi.getAll();
      // backend trả { success: true, data: [...] }
      setNotifications(res.data || res);
    } catch (err) {
      Swal.fire("Lỗi!", "Không thể tải danh sách thông báo.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  // 🔹 Upload ảnh lên Cloudinary
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
      );

      const res = await axios.post(
        import.meta.env.VITE_CLOUDINARY_UPLOAD_URL,
        formData
      );

      setForm({ ...form, image: res.data.secure_url });
      Swal.fire("🎉 Thành công!", "Ảnh đã được tải lên Cloudinary!", "success");
    } catch (err) {
      console.error("❌ Upload Cloudinary lỗi:", err);
      Swal.fire("Lỗi!", "Không thể tải ảnh lên Cloudinary.", "error");
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Gửi hoặc sửa thông báo
  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!form.title.trim() || !form.message.trim()) {
    Swal.fire("Thiếu thông tin!", "Vui lòng nhập đủ tiêu đề và nội dung.", "warning");
    return;
  }

  try {
    if (editing) {
      const res = await adminNotificationApi.update(editing, form);
      const updatedNotif = res.data; // nếu backend trả object
      setNotifications((prev) =>
        prev.map((n) => (n._id === editing ? updatedNotif : n))
      );
      Swal.fire("✅ Đã cập nhật!", "Thông báo đã được chỉnh sửa.", "success");
    } else {
      const res = await adminNotificationApi.create(form);
      const newNotif = res.data; // <-- bắt buộc phải dùng res.data
      setNotifications((prev) => [newNotif, ...prev]);
      Swal.fire("🎉 Thành công!", "Thông báo mới đã được gửi.", "success");
    }

    setForm({
      title: "",
      message: "",
      target: "",
      priority: "normal",
      image: "",
      scheduleAt: "",
    });
    setEditing(null);
    setShowModal(false);
  } catch (err) {
    Swal.fire("Lỗi!", "Không thể tạo hoặc sửa thông báo.", "error");
  }
};


  const deleteNotification = async (id) => {
    const confirm = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (!confirm.isConfirmed) return;

    try {
      await adminNotificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      Swal.fire("Đã xóa!", "Thông báo đã được xóa.", "success");
    } catch {
      Swal.fire("Lỗi!", "Không thể xóa thông báo.", "error");
    }
  };

  // 🔹 Đánh dấu đã đọc
  const markAsRead = async (id) => {
    try {
      await adminNotificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      Swal.fire("Lỗi!", "Không thể đánh dấu đã đọc.", "error");
    }
  };

  const startEdit = (notif) => {
    setEditing(notif._id);
    setForm({
      title: notif.title,
      message: notif.message,
      target: notif.target || "",
      priority: notif.priority || "normal",
      image: notif.image || "",
      scheduleAt: notif.scheduleAt || "",
    });
    setShowModal(true);
  };

  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : filter === "read"
      ? notifications.filter((n) => n.isRead)
      : notifications;

  return (
    <div className="p-6 bg-white rounded-2xl shadow border border-orange-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <Bell className="text-orange-500" /> Quản lý thông báo
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-orange-200 rounded-lg px-3 py-1.5 bg-orange-50">
            <Filter size={16} className="text-orange-400 mr-2" />
            <select
              className="bg-transparent text-sm text-gray-700 focus:outline-none"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="unread">Chưa đọc</option>
              <option value="read">Đã đọc</option>
            </select>
          </div>

          <button
            onClick={() => {
              setEditing(null);
              setForm({
                title: "",
                message: "",
                target: "",
                priority: "normal",
                image: "",
                scheduleAt: "",
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
          >
            <PlusCircle size={18} /> Thêm thông báo
          </button>
        </div>
      </div>

      {/* Danh sách */}
      {loading ? (
        <div className="text-center text-gray-500 py-10 animate-pulse">
          Đang tải thông báo...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-10 italic">
          Không có thông báo nào.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-orange-100 rounded-lg overflow-hidden">
            <thead className="bg-orange-100 text-orange-800">
              <tr>
                <th className="px-4 py-2 text-left">Tiêu đề</th>
                <th className="px-4 py-2 text-left">Nội dung</th>
                <th className="px-4 py-2 text-center">Ảnh</th>
                <th className="px-4 py-2 text-center">Trạng thái</th>
                <th className="px-4 py-2 text-center">Thời gian</th>
                <th className="px-4 py-2 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr
                  key={n._id}
                  className="border-t hover:bg-orange-50 transition cursor-pointer"
                  onClick={() => {
                    if (!n.isRead) markAsRead(n._id);
                  }}
                >
                  <td className="px-4 py-2 font-semibold">{n.title}</td>
                  <td className="px-4 py-2 text-gray-700">{n.message}</td>
                  <td className="px-4 py-2 text-center">
                    {n.image ? (
                      <img
                        src={n.image}
                        alt="thumb"
                        className="w-12 h-12 object-cover rounded-lg mx-auto"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {n.isRead ? (
                      <span className="text-green-600 font-medium">Đã đọc</span>
                    ) : (
                      <span className="text-orange-600 font-medium">Chưa đọc</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center text-gray-500 text-sm">
                    {n.createdAt
                      ? new Date(n.createdAt).toLocaleString("vi-VN")
                      : ""}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center gap-3">
                      {!n.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n._id);
                          }}
                          className="text-green-600 hover:text-green-800"
                          title="Đánh dấu đã đọc"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(n);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                        title="Sửa"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n._id);
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                {editing ? <Edit2 /> : <PlusCircle />}
                {editing ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white text-xl"
              >
                <X />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {/* Tiêu đề */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề nổi bật..."
                  className="w-full border border-orange-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-300 outline-none"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Gửi đến */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gửi đến
                </label>
                <select
                  className="w-full border border-orange-200 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-orange-300 outline-none"
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                >
                  <option value="">-- Chọn đối tượng --</option>
                  <option value="all">Tất cả</option>
                  <option value="students">Học viên</option>
                  <option value="teachers">Giảng viên</option>
                  <option value="admins">Quản trị viên</option>
                </select>
              </div>

              {/* Mức độ ưu tiên */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mức độ ưu tiên
                </label>
                <select
                  className="w-full border border-orange-200 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-orange-300 outline-none"
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                >
                  <option value="normal">Bình thường</option>
                  <option value="important">Quan trọng</option>
                  <option value="urgent">Khẩn cấp</option>
                </select>
              </div>

              {/* Upload ảnh */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh minh họa
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="w-full border border-orange-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-300 outline-none"
                  />
                  {uploading && (
                    <span className="text-sm text-gray-500">Đang tải...</span>
                  )}
                </div>
                {form.image && (
                  <img
                    src={form.image}
                    alt="Preview"
                    className="mt-3 w-32 h-32 object-cover rounded-lg border"
                  />
                )}
              </div>

              {/* Nội dung */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung chi tiết
                </label>
                <textarea
                  placeholder="Nhập nội dung thông báo..."
                  className="w-full border border-orange-200 rounded-lg px-4 py-2 h-28 focus:ring-2 focus:ring-orange-300 outline-none"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>

              {/* Hẹn giờ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian gửi (tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  className="w-full border border-orange-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-300 outline-none"
                  value={form.scheduleAt}
                  onChange={(e) =>
                    setForm({ ...form, scheduleAt: e.target.value })
                  }
                />
              </div>

              {/* Nút hành động */}
              <div className="col-span-2 flex justify-end gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg shadow transition"
                >
                  <Send size={16} />
                  {editing ? "Lưu thay đổi" : "Gửi thông báo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
