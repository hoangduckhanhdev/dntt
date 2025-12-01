import React, { useEffect, useState } from "react";
import { Calendar, Mail, MapPin, Phone, User, Upload, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import adminProfileApi from "../../api/adminProfileApi";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [original, setOriginal] = useState(null);
  const [preview, setPreview] = useState("");

  // 📦 Lấy dữ liệu hồ sơ admin
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await adminProfileApi.getProfile();
        if (!data) {
          const empty = { name: "", email: "", phone: "", birthday: "", address: "", avatar: "" };
          setProfile(empty);
          setOriginal(empty);
          toast.warning("⚠️ Không có dữ liệu hồ sơ quản trị viên!");
          return;
        }
        setProfile(data);
        setOriginal(data);
        setPreview(data.avatar || "");
      } catch (err) {
        console.error(err);
        toast.error("❌ Không thể tải hồ sơ quản trị viên!");
      }
    };
    fetchProfile();
  }, []);

  // 📸 Upload ảnh trực tiếp lên Cloudinary
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file)); // hiển thị trước ảnh

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(import.meta.env.VITE_CLOUDINARY_UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.secure_url) {
        setProfile((prev) => ({ ...prev, avatar: data.secure_url }));
        toast.success("✅ Ảnh đã tải lên thành công!");
      } else {
        toast.error("❌ Lỗi khi tải ảnh: " + (data.error?.message || "Không xác định"));
        setPreview(profile?.avatar || "");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("❌ Không thể tải ảnh!");
      setPreview(profile?.avatar || "");
    }
  };

  // 💾 Lưu thay đổi
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await adminProfileApi.updateProfile(profile);
      toast.success("✅ Cập nhật hồ sơ thành công!");
      setOriginal(profile);
    } catch (err) {
      console.error(err);
      toast.error("❌ Lỗi khi cập nhật hồ sơ!");
    }
  };

  // ❌ Hủy thay đổi
  const handleCancel = () => {
    if (!original) return toast.warning("⚠️ Không có dữ liệu để hủy!");
    if (!window.confirm("Bạn có chắc muốn hủy thay đổi?")) return;
    setProfile({ ...original });
    setPreview(original.avatar || "");
    toast.info("Đã hủy thay đổi!");
  };

  const handleBack = () => navigate(-1);

  if (!profile) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Đang tải hồ sơ...</div>;
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-8 max-w-3xl mx-auto mt-10 border border-orange-100">
      <ToastContainer position="top-center" autoClose={2000} />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-orange-600 flex items-center gap-2">
          <User className="text-orange-500" /> Hồ sơ quản trị viên
        </h2>
        <button onClick={handleBack} className="flex items-center gap-1 text-gray-500 hover:text-orange-500 transition text-sm font-medium">
          <XCircle size={16} /> Quay lại
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              src={preview || "https://i.pravatar.cc/150"}
              alt="Avatar"
              className="w-28 h-28 rounded-full object-cover border-4 border-orange-300 shadow-md"
            />
            <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer hover:bg-orange-600 transition">
              <Upload size={16} className="text-white" />
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </label>
          </div>
          <p className="text-gray-500 text-sm mt-2">Nhấn để thay đổi ảnh</p>
        </div>

        {/* Thông tin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField label="Họ và tên" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} icon={<User className="text-orange-400 mr-2" />} />
          <InputField label="Email" value={profile.email} type="email" onChange={(e) => setProfile({ ...profile, email: e.target.value })} icon={<Mail className="text-orange-400 mr-2" />} />
          <InputField label="Số điện thoại" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} icon={<Phone className="text-orange-400 mr-2" />} />
          <InputField label="Ngày sinh" type="date" value={profile.birthday ? profile.birthday.substring(0, 10) : ""} onChange={(e) => setProfile({ ...profile, birthday: e.target.value })} icon={<Calendar className="text-orange-400 mr-2" />} />
        </div>

        <InputField label="Địa chỉ" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} icon={<MapPin className="text-orange-400 mr-2" />} />

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={handleCancel} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium transition">
            Hủy thay đổi
          </button>
          <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl shadow-md transition font-medium">
            💾 Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}

function InputField({ icon, label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-gray-600 mb-1">{label}</label>
      <div className="flex items-center border rounded-xl px-3 py-2 focus-within:ring-2 ring-orange-300">
        {icon}
        <input type={type} className="w-full outline-none" value={value || ""} onChange={onChange} />
      </div>
    </div>
  );
}
