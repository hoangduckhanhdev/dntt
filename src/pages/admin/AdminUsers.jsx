import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  getUsers,
  deleteUser,
  updateUserRole,
  createUser,
  updateUser,
  updateUserPassword,
} from "../../api/adminUserApi";
import { Search, Trash2, UserCog, UserPlus, Edit, KeyRound } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 6;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers();
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.users)
        ? res.data.users
        : [];

      setUsers(list);
      setCurrentPage(1);
    } catch (err) {
      console.error("❌ Lỗi khi tải users:", err);
      Swal.fire("Lỗi!", "Không thể tải danh sách người dùng.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await updateUserRole(id, { role });
      Swal.fire("Thành công!", "Vai trò đã được cập nhật.", "success");
      fetchUsers();
    } catch (err) {
      Swal.fire("Lỗi!", "Không thể cập nhật vai trò.", "error");
    }
  };

  // ------------------ THÊM USER ------------------
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
      preConfirm: () => ({
        name: document.getElementById("swal-name").value,
        email: document.getElementById("swal-email").value,
        password: document.getElementById("swal-password").value,
        role: document.getElementById("swal-role").value,
        avatar: document.getElementById("swal-avatar").files[0],
      }),
    });

    if (!formValues) return;

    try {
      const formData = new FormData();
      Object.keys(formValues).forEach((key) => {
        if (formValues[key]) formData.append(key, formValues[key]);
      });

      await createUser(formData);

      Swal.fire("Thành công!", "Người dùng đã được tạo.", "success");
      fetchUsers();
    } catch (err) {
      console.error(err);
      Swal.fire("Lỗi", "Không thể tạo user mới.", "error");
    }
  };

  // ------------------ SỬA USER ------------------
  const handleEditUser = async (user) => {
    const { value: values } = await Swal.fire({
      title: "✏️ Chỉnh sửa người dùng",
      html: `
        <input id="swal-name" class="swal2-input" value="${user.name}">
        <input id="swal-email" class="swal2-input" value="${user.email}">
      `,
      preConfirm: () => ({
        name: document.getElementById("swal-name").value,
        email: document.getElementById("swal-email").value,
      }),
    });

    if (!values) return;

    try {
      await updateUser(user._id, values);
      Swal.fire("Thành công!", "Thông tin đã cập nhật.", "success");
      fetchUsers();
    } catch {
      Swal.fire("Lỗi!", "Không thể cập nhật.", "error");
    }
  };

  // ------------------ ĐỔI PASSWORD ------------------
  const handleChangePassword = async (user) => {
    const { value } = await Swal.fire({
      title: "🔐 Đổi mật khẩu",
      input: "password",
      inputLabel: `Mật khẩu mới cho ${user.email}`,
      inputPlaceholder: "Nhập mật khẩu mới",
      inputAttributes: { minlength: 4 },
      showCancelButton: true,
    });

    if (!value) return;

    try {
      await updateUserPassword(user._id, { password: value });
      Swal.fire("Thành công!", "Mật khẩu đã được cập nhật.", "success");
    } catch {
      Swal.fire("Lỗi!", "Không thể đổi mật khẩu.", "error");
    }
  };

  // ------------------ XOÁ USER ------------------
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Bạn chắc chắn?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteUser(id);
      Swal.fire("Đã xoá!", "Người dùng đã bị xoá.", "success");
      fetchUsers();
    } catch {
      Swal.fire("Lỗi!", "Không thể xoá người dùng.", "error");
    }
  };

  // ------------------ FILTER + SEARCH ------------------
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());

    const matchRole = filterRole === "all" || u.role === filterRole;

    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const safePage = Math.min(currentPage, totalPages || 1);
  const startIndex = (safePage - 1) * pageSize;

  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + pageSize
  );

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">Quản lý người dùng</h1>

        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow hover:bg-orange-600"
        >
          <UserPlus size={18} /> Thêm người dùng
        </button>
      </div>

      {/* Search + Filter */}
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

      {/* Danh sách users */}
      {filteredUsers.length === 0 ? (
        <p className="text-gray-500 text-center">Không tìm thấy người dùng.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedUsers.map((user) => (
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
                  <p className="text-gray-500 text-sm">{user.email}</p>

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

          {/* Phân trang */}
          <div className="mt-6 flex flex-wrap items-center justify-between text-sm text-gray-600 gap-2">
            <span>
              Hiển thị{" "}
              <strong>
                {startIndex + 1}-
                {Math.min(startIndex + pageSize, filteredUsers.length)}
              </strong>{" "}
              / <strong>{filteredUsers.length}</strong> người dùng
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-40"
              >
                Trước
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1 border rounded-lg ${
                    safePage === idx + 1
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage === totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
