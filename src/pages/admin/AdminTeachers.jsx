// src/pages/admin/AdminTeachers.jsx
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Plus, Edit, Trash, Info } from "lucide-react";
import {
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from "../../api/adminTeacherApi";

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data } = await getAllTeachers();
      setTeachers(data.teachers || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Lỗi!", "Không thể tải danh sách giáo viên!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  /* ================== THÊM GIÁO VIÊN ================== */
  const handleAdd = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Thêm giáo viên mới",
      width: 900,
      html: `
        <div style="display:flex; gap:16px; align-items:flex-start; max-height:70vh; overflow:auto; padding-right:4px;">
          <!-- Cột 1: Thông tin chung -->
          <div style="flex:1 1 260px;">
            <h3 style="font-size:14px; font-weight:600; margin-bottom:6px;">Thông tin chung</h3>

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Tên giáo viên *</label>
            <input id="swal-name" class="swal2-input" placeholder="VD: Nguyễn Văn A">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Email (tạo User)</label>
            <input id="swal-email" type="email" class="swal2-input" placeholder="Email đăng nhập (tùy chọn)">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Mật khẩu (nếu tạo tài khoản)</label>
            <input id="swal-password" type="password" class="swal2-input" placeholder="Tối thiểu 6 ký tự">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Chức danh</label>
            <input id="swal-title" class="swal2-input" placeholder="VD: Giảng viên Frontend">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Chuyên môn chính</label>
            <input id="swal-expertise" class="swal2-input" placeholder="VD: ReactJS, NodeJS">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Số điện thoại</label>
            <input id="swal-phone" class="swal2-input" placeholder="VD: 09xx xxx xxx">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Link Zalo (tùy chọn)</label>
            <input id="swal-zalo" class="swal2-input" placeholder="https://zalo.me/...">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Link Messenger (tùy chọn)</label>
            <input id="swal-messenger" class="swal2-input" placeholder="https://m.me/...">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Link đăng ký khóa học</label>
            <input id="swal-register" class="swal2-input" placeholder="Đường dẫn tới trang đăng ký">
            
            <label style="font-size:12px; color:#6b7280; display:block; margin-top:6px;">Ảnh đại diện</label>
            <input id="swal-image" type="file" class="swal2-file" accept="image/*">
          </div>

          <!-- Cột 2: Giới thiệu / mô tả -->
          <div style="flex:1 1 260px;">
            <h3 style="font-size:14px; font-weight:600; margin-bottom:6px;">Giới thiệu & mô tả</h3>

            <label style="font-size:12px; color:#6b7280; display:block;">Mô tả ngắn (hiển thị ở đầu trang)</label>
            <textarea id="swal-bio" class="swal2-textarea" rows="2" placeholder="VD: 5+ năm kinh nghiệm React, từng làm ở..."></textarea>

            <label style="font-size:12px; color:#6b7280; display:block;">Giới thiệu chi tiết</label>
            <textarea id="swal-intro" class="swal2-textarea" rows="3" placeholder="Tự giới thiệu, định hướng giảng dạy, đối tượng học viên..."></textarea>

            <label style="font-size:12px; color:#6b7280; display:block;">Kinh nghiệm giảng dạy</label>
            <textarea id="swal-exp" class="swal2-textarea" rows="3" placeholder="VD: 3 năm đào tạo tại..., hơn 1000 học viên..."></textarea>

            <label style="font-size:12px; color:#6b7280; display:block;">Phong cách giảng dạy</label>
            <textarea id="swal-style" class="swal2-textarea" rows="2" placeholder="VD: Thực hành nhiều, đi thẳng vào dự án thực tế..."></textarea>

            <label style="font-size:12px; color:#6b7280; display:block;">Các điểm nổi bật (mỗi dòng 1 ý)</label>
            <textarea id="swal-achievements" class="swal2-textarea" rows="3" placeholder="- Hơn 50 dự án thực tế&#10;- Giảng dạy tại ...&#10;- Chứng chỉ ..."></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Thêm",
      cancelButtonText: "Hủy",
      preConfirm: () => {
        const name = document.getElementById("swal-name").value.trim();
        if (!name) {
          Swal.showValidationMessage("⚠️ Vui lòng nhập tên giáo viên!");
          return false;
        }

        const get = (id) => document.getElementById(id)?.value.trim();

        const email = get("swal-email");
        const password = get("swal-password");
        const title = get("swal-title");
        const expertise = get("swal-expertise");
        const phone = get("swal-phone");
        const zaloLink = get("swal-zalo");
        const messengerLink = get("swal-messenger");
        const registerLink = get("swal-register");
        const bio = get("swal-bio");
        const intro = get("swal-intro");
        const teachingExperience = get("swal-exp");
        const teachingStyle = get("swal-style");
        const achievementsText = get("swal-achievements");
        const imageFile = document.getElementById("swal-image").files[0];

        return {
          name,
          email,
          password,
          title,
          expertise,
          phone,
          zaloLink,
          messengerLink,
          registerLink,
          bio,
          intro,
          teachingExperience,
          teachingStyle,
          achievementsText,
          imageFile,
        };
      },
    });

    if (!formValues) return;

    try {
      const formData = new FormData();
      Object.entries(formValues).forEach(([k, v]) => {
        if (k === "imageFile") {
          if (v) formData.append("image", v);
        } else if (v) {
          formData.append(k, v);
        }
      });

      await createTeacher(formData);
      Swal.fire("Thành công!", "Giáo viên đã được thêm!", "success");
      fetchTeachers();
    } catch (err) {
      console.error("❌ createTeacher error:", err);
      Swal.fire(
        "Lỗi!",
        err.response?.data?.message || "Không thể thêm giáo viên!",
        "error"
      );
    }
  };

  /* ================== SỬA GIÁO VIÊN ================== */
  const handleEdit = async (teacher) => {
    const { value: formValues } = await Swal.fire({
      title: "Chỉnh sửa giáo viên",
      width: 900,
      html: `
        <div style="display:flex; gap:16px; align-items:flex-start; max-height:70vh; overflow:auto; padding-right:4px;">
          <!-- Cột 1 -->
          <div style="flex:1 1 260px;">
            <h3 style="font-size:14px; font-weight:600; margin-bottom:6px;">Thông tin chung</h3>

            <label style="font-size:12px; color:#6b7280; display:block;">Tên giáo viên *</label>
            <input id="swal-name" class="swal2-input" value="${teacher.name || ""}" placeholder="VD: Nguyễn Văn A">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Email (liên kết User)</label>
            <input id="swal-email" type="email" class="swal2-input" value="${teacher.email || ""}" placeholder="Email nếu muốn đồng bộ User">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Chức danh</label>
            <input id="swal-title" class="swal2-input" value="${teacher.title || ""}" placeholder="VD: Giảng viên Frontend">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Chuyên môn</label>
            <input id="swal-expertise" class="swal2-input" value="${teacher.expertise || ""}" placeholder="VD: ReactJS, NodeJS">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Số điện thoại</label>
            <input id="swal-phone" class="swal2-input" value="${teacher.phone || ""}" placeholder="VD: 09xx xxx xxx">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Link Zalo</label>
            <input id="swal-zalo" class="swal2-input" value="${teacher.zaloLink || ""}" placeholder="https://zalo.me/...">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Link Messenger</label>
            <input id="swal-messenger" class="swal2-input" value="${teacher.messengerLink || ""}" placeholder="https://m.me/...">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:4px;">Link đăng ký khóa học</label>
            <input id="swal-register" class="swal2-input" value="${teacher.registerLink || ""}" placeholder="Đường dẫn tới trang đăng ký">

            <label style="font-size:12px; color:#6b7280; display:block; margin-top:6px;">Đổi ảnh (tùy chọn)</label>
            <input id="swal-image" type="file" class="swal2-file" accept="image/*">
          </div>

          <!-- Cột 2 -->
          <div style="flex:1 1 260px;">
            <h3 style="font-size:14px; font-weight:600; margin-bottom:6px;">Giới thiệu & mô tả</h3>

            <label style="font-size:12px; color:#6b7280; display:block;">Mô tả ngắn</label>
            <textarea id="swal-bio" class="swal2-textarea" rows="2">${teacher.bio || ""}</textarea>

            <label style="font-size:12px; color:#6b7280; display:block;">Giới thiệu chi tiết</label>
            <textarea id="swal-intro" class="swal2-textarea" rows="3">${teacher.intro || ""}</textarea>

            <label style="font-size:12px; color:#6b7280; display:block;">Kinh nghiệm giảng dạy</label>
            <textarea id="swal-exp" class="swal2-textarea" rows="3">${teacher.teachingExperience || ""}</textarea>

            <label style="font-size:12px; color:#6b7280; display:block;">Phong cách giảng dạy</label>
            <textarea id="swal-style" class="swal2-textarea" rows="2">${teacher.teachingStyle || ""}</textarea>

            <label style="font-size:12px; color:#6b7280; display:block;">Các điểm nổi bật (mỗi dòng 1 ý)</label>
            <textarea id="swal-achievements" class="swal2-textarea" rows="3">${(teacher.achievements || []).join(
              "\n"
            )}</textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Lưu",
      cancelButtonText: "Hủy",
      preConfirm: () => {
        const name = document.getElementById("swal-name").value.trim();
        if (!name) {
          Swal.showValidationMessage("⚠️ Vui lòng nhập tên giáo viên!");
          return false;
        }
        const get = (id) => document.getElementById(id)?.value.trim();

        const email = get("swal-email");
        const title = get("swal-title");
        const expertise = get("swal-expertise");
        const phone = get("swal-phone");
        const zaloLink = get("swal-zalo");
        const messengerLink = get("swal-messenger");
        const registerLink = get("swal-register");
        const bio = get("swal-bio");
        const intro = get("swal-intro");
        const teachingExperience = get("swal-exp");
        const teachingStyle = get("swal-style");
        const achievementsText = get("swal-achievements");
        const imageFile = document.getElementById("swal-image").files[0];

        return {
          name,
          email,
          title,
          expertise,
          phone,
          zaloLink,
          messengerLink,
          registerLink,
          bio,
          intro,
          teachingExperience,
          teachingStyle,
          achievementsText,
          imageFile,
        };
      },
    });

    if (!formValues) return;

    try {
      const formData = new FormData();
      formData.append("name", formValues.name);
      if (teacher.user) formData.append("userId", teacher.user);

      Object.entries(formValues).forEach(([k, v]) => {
        if (k === "imageFile") {
          if (v) formData.append("image", v);
        } else if (k !== "name" && v) {
          formData.append(k, v);
        }
      });

      await updateTeacher(teacher._id, formData);
      Swal.fire("Thành công!", "Giáo viên đã được cập nhật!", "success");
      fetchTeachers();
    } catch (err) {
      console.error("❌ updateTeacher error:", err);
      Swal.fire(
        "Lỗi!",
        err.response?.data?.message || "Không thể cập nhật giáo viên!",
        "error"
      );
    }
  };

  /* ================== XÓA GIÁO VIÊN ================== */
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Xóa giáo viên?",
      text: "Bạn có chắc chắn muốn xóa giáo viên này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#f97316",
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteTeacher(id);
      Swal.fire("Đã xóa!", "Giáo viên đã được xóa.", "success");
      fetchTeachers();
    } catch (err) {
      console.error("❌ deleteTeacher error:", err);
      Swal.fire("Lỗi!", "Không thể xóa giáo viên!", "error");
    }
  };

  /* ================== MODAL CHI TIẾT ================== */
  const TeacherDetailModal = ({ teacher, onClose }) => {
    if (!teacher) return null;
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 font-bold text-xl"
          >
            ×
          </button>

          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={teacher.image || "https://via.placeholder.com/150"}
              alt={teacher.name}
              className="w-40 h-40 rounded-full border object-cover"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-orange-600 mb-2">
                {teacher.name}
              </h2>
              <p className="text-gray-700 mb-1">
                <strong>Chức danh:</strong> {teacher.title || "—"}
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Chuyên môn:</strong> {teacher.expertise || "—"}
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Khóa học:</strong> {teacher.totalCourses || 0}
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Đánh giá:</strong> {teacher.rating || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ================== UI DANH SÁCH ================== */
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">👨‍🏫 Quản lý giáo viên</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          <Plus size={18} />
          <span>Thêm giáo viên</span>
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Đang tải...</p>
      ) : teachers.length === 0 ? (
        <p className="text-center text-gray-500">Chưa có giáo viên nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-orange-100 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Ảnh</th>
                <th className="px-4 py-3 text-left">Tên giáo viên</th>
                <th className="px-4 py-3 text-left">Chức danh</th>
                <th className="px-4 py-3 text-left">Chuyên môn</th>
                <th className="px-4 py-3 text-center w-36">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t._id} className="border-t hover:bg-orange-50">
                  <td className="px-4 py-3">
                    <img
                      src={t.image || "https://via.placeholder.com/100"}
                      alt={t.name}
                      className="w-12 h-12 rounded-full object-cover border"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {t.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.title || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.expertise || "—"}
                  </td>
                  <td className="px-4 py-3 text-center flex justify-center gap-3">
                    <button
                      onClick={() => handleEdit(t)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash size={18} />
                    </button>
                    <button
                      onClick={() => setSelectedTeacher(t)}
                      className="text-orange-500 hover:text-orange-700"
                    >
                      <Info size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTeacher && (
        <TeacherDetailModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
        />
      )}
    </div>
  );
}
