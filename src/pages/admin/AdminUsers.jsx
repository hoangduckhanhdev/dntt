// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  getUsers,
  deleteUser,
  updateUserRole,
  createUser,
  updateUser,
  updateUserPassword, // ✅ thêm
} from "../../api/adminUserApi";
import { Search, Trash2, UserCog, UserPlus, Edit, KeyRound } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      // backend có thể trả mảng trực tiếp hoặc { users: [...] }
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.users)
        ? res.data.users
        : [];
      setUsers(list);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách users:", err);
      Swal.fire("Lỗi!", "Không thể tải danh sách người dùng.", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- THÊM USER MỚI --------------------
  const handleAddUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: "➕ Thêm người dùng mới",
      html: `
        <input id="swal-name" class="swal2-input" placeholder="Tên người dùng">
        <input id="swal-email" type="email" class="swal2-input" placeholder="Email">
        <input id="swal-password" type="password" class="swal2-input" placeholder="Mật khẩu">
        <select id="swal-role" class="swal2-input">
          <option value="student">Học viên</option>
          <option value="teacher">Giảng viên</option>
          <option value="admin">Quản trị</option>
        </select>
        <input id="swal-avatar" type="file" class="swal2-file" accept="image/*">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Tạo",
      cancelButtonText: "Hủy",
      preConfirm: () => {
        const name = document.getElementById("swal-name").value.trim();
        const email = document.getElementById("swal-email").value.trim();
        const password = document.getElementById("swal-password").value.trim();
        const role = document.getElementById("swal-role").value;
        const avatar = document.getElementById("swal-avatar").files[0];
        if (!name || !email || !password) {
          Swal.showValidationMessage("⚠️ Vui lòng nhập đầy đủ thông tin!");
          return false;
        }
        return { name, email, password, role, avatar };
      },
    });

    if (!formValues) return;

    try {
      const formData = new FormData();
      formData.append("name", formValues.name);
      formData.append("email", formValues.email);
      formData.append("password", formValues.password);
      formData.append("role", formValues.role);
      if (formValues.avatar) formData.append("avatar", formValues.avatar);

      const res = await createUser(formData);
      const created = res.data?.user || res.data;

      setUsers((prev) => [...prev, created]);
      Swal.fire("✅ Thành công!", "Đã thêm người dùng mới.", "success");
    } catch (err) {
      console.error("❌ Lỗi khi thêm user:", err);
      Swal.fire(
        "Lỗi!",
        err.response?.data?.message || "Không thể tạo người dùng.",
        "error"
      );
    }
  };

  // -------------------- SỬA USER --------------------
  const handleEditUser = async (user) => {
    const { value: formValues } = await Swal.fire({
      title: "✏️ Chỉnh sửa người dùng",
      html: `
        <input id="swal-name" class="swal2-input" placeholder="Tên người dùng" value="${user.name || ""}">
        <input id="swal-email" type="email" class="swal2-input" placeholder="Email" value="${user.email || ""}">
        <select id="swal-role" class="swal2-input">
          <option value="student" ${user.role === "student" ? "selected" : ""}>Học viên</option>
          <option value="teacher" ${user.role === "teacher" ? "selected" : ""}>Giảng viên</option>
          <option value="admin" ${user.role === "admin" ? "selected" : ""}>Quản trị</option>
        </select>
        <input id="swal-avatar" type="file" class="swal2-file" accept="image/*">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Lưu",
      cancelButtonText: "Hủy",
      preConfirm: () => {
        const name = document.getElementById("swal-name").value.trim();
        const email = document.getElementById("swal-email").value.trim();
        const role = document.getElementById("swal-role").value;
        const avatar = document.getElementById("swal-avatar").files[0];
        if (!name || !email) {
          Swal.showValidationMessage("⚠️ Vui lòng nhập đầy đủ thông tin!");
          return false;
        }
        return { name, email, role, avatar };
      },
    });

    if (!formValues) return;

    try {
      const formData = new FormData();
      formData.append("name", formValues.name);
      formData.append("email", formValues.email);
      formData.append("role", formValues.role);
      if (formValues.avatar) formData.append("avatar", formValues.avatar);

      const res = await updateUser(user._id, formData);
      const updated = res.data?.user || res.data;

      setUsers((prev) => prev.map((u) => (u._id === user._id ? updated : u)));

      Swal.fire("✅ Thành công!", "Thông tin người dùng đã được cập nhật.", "success");
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật user:", err);
      Swal.fire(
        "Lỗi!",
        err.response?.data?.message || "Không thể cập nhật người dùng.",
        "error"
      );
    }
  };

  // -------------------- ĐỔI MẬT KHẨU USER --------------------
  const handleChangePassword = async (user) => {
    const { value: formValues } = await Swal.fire({
      title: `🔑 Đổi mật khẩu cho\n${user.name || user.email}`,
      html: `
        <input id="swal-password" type="password" class="swal2-input" placeholder="Mật khẩu mới">
        <input id="swal-password-confirm" type="password" class="swal2-input" placeholder="Nhập lại mật khẩu mới">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Cập nhật",
      cancelButtonText: "Hủy",
      preConfirm: () => {
        const password = document.getElementById("swal-password").value.trim();
        const password2 = document
          .getElementById("swal-password-confirm")
          .value.trim();

        if (!password || !password2) {
          Swal.showValidationMessage("⚠️ Vui lòng nhập đầy đủ 2 ô mật khẩu!");
          return false;
        }
        if (password !== password2) {
          Swal.showValidationMessage("⚠️ Mật khẩu nhập lại không khớp!");
          return false;
        }
        if (password.length < 6) {
          Swal.showValidationMessage("⚠️ Mật khẩu nên từ 6 ký tự trở lên!");
          return false;
        }
        return { password };
      },
    });

    if (!formValues) return;

    try {
      await updateUserPassword(user._id, formValues.password);
      Swal.fire("✅ Thành công!", "Mật khẩu đã được cập nhật.", "success");
    } catch (err) {
      console.error("❌ Lỗi khi đổi mật khẩu:", err);
      Swal.fire(
        "Lỗi!",
        err.response?.data?.message || "Không thể cập nhật mật khẩu.",
        "error"
      );
    }
  };

  // -------------------- XÓA USER --------------------
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Xóa người dùng?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      Swal.fire("Đã xóa!", "Người dùng đã bị xóa.", "success");
    } catch (err) {
      console.error("❌ Lỗi khi xóa user:", err);
      Swal.fire("Thất bại!", "Không thể xóa người dùng.", "error");
    }
  };

  // -------------------- CẬP NHẬT ROLE --------------------
  const handleRoleChange = async (id, newRole) => {
    try {
      await updateUserRole(id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: newRole } : u))
      );
      Swal.fire("Thành công!", "Đã cập nhật vai trò người dùng.", "success");
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật role:", err);
      Swal.fire("Lỗi!", "Cập nhật thất bại.", "error");
    }
  };

  // -------------------- LỌC + TÌM KIẾM --------------------
  const filteredUsers = users.filter((u) => {
    const name = (u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const matchSearch =
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  if (loading)
    return (
      <div className="text-center text-gray-600 mt-10 animate-pulse">
        Đang tải dữ liệu người dùng...
      </div>
    );

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          👥 Quản lý người dùng
        </h1>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg shadow-md transition"
        >
          <UserPlus size={16} /> Thêm người dùng
        </button>
      </div>

      {/* Tìm kiếm + lọc */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div className="flex items-center border rounded-lg px-3 py-2 w-full md:w-72 bg-white shadow-sm">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none w-full text-sm"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border rounded-lg px-3 py-2 bg-white text-sm shadow-sm"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="student">Học viên</option>
          <option value="teacher">Giảng viên</option>
          <option value="admin">Quản trị viên</option>
        </select>
      </div>

      {/* Danh sách user */}
      {filteredUsers.length === 0 ? (
        <p className="text-gray-500 text-center">
          Không tìm thấy người dùng nào.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white p-5 rounded-2xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <img
                  src={user.avatar || "https://via.placeholder.com/80"}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-orange-200"
                />
                <h2 className="font-semibold text-gray-800">
                  {user.name || "Chưa có tên"}
                </h2>
                <p className="text-gray-500 text-sm">
                  {user.email || "Chưa có email"}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <UserCog size={16} className="text-orange-400" />
                  <select
                    className="border rounded-md px-2 py-1 text-sm"
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user._id, e.target.value)
                    }
                  >
                    <option value="student">Học viên</option>
                    <option value="teacher">Giảng viên</option>
                    <option value="admin">Quản trị</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-2 rounded-lg shadow-sm transition"
                  >
                    <Edit size={14} /> Sửa
                  </button>

                  <button
                    onClick={() => handleChangePassword(user)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm px-3 py-2 rounded-lg shadow-sm transition"
                  >
                    <KeyRound size={14} /> Đổi mật khẩu
                  </button>

                  <button
                    onClick={() => handleDelete(user._id)}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded-lg shadow-sm transition"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
