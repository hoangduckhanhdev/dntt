// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Edit,
  Mail,
  Phone,
  MapPin,
  Globe,
  Brain,
  Info,
  Upload,
  ArrowLeft,
  Save,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api/config"; // ⬅ Sửa: dùng API chuẩn

const ProfilePage = () => {
  const [user, setUser] = useState({});
  const [form, setForm] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const axiosAuth = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });

  // ======================= LOAD PROFILE ==========================
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosAuth.get("/users/profile");

        const data = res?.data?.user || res?.data || {};

        setUser(data);
        setForm(data);
      } catch (err) {
        console.error("❌ Lỗi tải hồ sơ:", err);
      }
    };
    fetchProfile();
  }, []);

  // ======================= HANDLE INPUT ==========================
  const handleChange = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  // ======================= FORMAT IMG URL =========================
  const resolveImg = (src, fallback) => {
    if (!src) return fallback;

    if (src.startsWith("http")) return src;

    return `${API_URL.replace("/api", "")}/${src.startsWith("/") ? src.slice(1) : src}`;
  };

  // ======================= SAVE PROFILE ==========================
  const handleSave = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (form[key] !== undefined && form[key] !== null) {
        formData.append(key, form[key]);
      }
    });

    if (avatarFile) formData.append("avatar", avatarFile);
    if (coverFile) formData.append("cover", coverFile);

    try {
      const res = await axiosAuth.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res?.data?.user || res.data;

      setUser(updated);
      setForm(updated);
      setEditMode(false);

      setMessage("🎉 Hồ sơ đã được cập nhật!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      setMessage("❌ Cập nhật thất bại!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-10 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden relative"
      >
        {/* ====================== COVER ============================ */}
        <div className="relative">
          <img
            src={
              coverFile
                ? URL.createObjectURL(coverFile)
                : resolveImg(
                    user.cover,
                    "https://res.cloudinary.com/demo/image/upload/v1686120453/sample.jpg"
                  )
            }
            className="h-64 w-full object-cover"
            alt="cover"
          />

          {editMode && (
            <label className="absolute top-3 right-3 bg-white px-3 py-2 rounded-lg shadow flex items-center gap-2 cursor-pointer text-orange-600 font-medium hover:bg-orange-100 transition">
              <Upload size={18} /> Ảnh bìa
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setCoverFile(e.target.files[0])}
              />
            </label>
          )}

          {/* ====================== AVATAR =========================== */}
          <div className="absolute -bottom-20 left-16 flex items-center gap-6">
            <div className="relative">
              <img
                src={
                  avatarFile
                    ? URL.createObjectURL(avatarFile)
                    : resolveImg(user.avatar, "https://via.placeholder.com/150")
                }
                className="w-40 h-40 rounded-full border-4 border-white shadow-xl object-cover"
                alt="avatar"
              />

              {editMode && (
                <label className="absolute bottom-2 right-2 bg-orange-500 p-2 rounded-full cursor-pointer">
                  <Upload size={18} color="white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setAvatarFile(e.target.files[0])}
                  />
                </label>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    className="border-b border-gray-300 focus:border-orange-500 outline-none"
                    value={form.name || ""}
                    onChange={handleChange}
                  />
                ) : (
                  user.name || "Người dùng"
                )}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Mail size={16} /> {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* ======================= BODY ============================ */}
        <div className="pt-28 px-10 pb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold text-gray-800 flex items-center gap-2">
              <User className="text-orange-500" /> Hồ sơ học viên
            </h2>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 border border-orange-400 text-orange-600 px-5 py-2 rounded-lg hover:bg-orange-50 transition shadow-sm"
              >
                <ArrowLeft size={18} /> Trang chủ
              </button>

              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl shadow transition ${
                  editMode
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                <Edit size={18} />
                {editMode ? "Hủy" : "Chỉnh sửa"}
              </button>
            </div>
          </div>

          {/* ======================= INFO FIELDS ======================= */}
          <AnimatePresence mode="wait">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {editMode ? (
                <form className="grid md:grid-cols-2 gap-6" onSubmit={handleSave}>
                  {[
                    { name: "phone", label: "Số điện thoại", icon: Phone },
                    { name: "address", label: "Địa chỉ", icon: MapPin },
                    { name: "website", label: "Website", icon: Globe },
                    { name: "bio", label: "Giới thiệu", icon: Info },
                    { name: "skills", label: "Kỹ năng", icon: Brain },
                  ].map(({ name, label, icon: Icon }) => (
                    <div className="flex flex-col gap-2" key={name}>
                      <label className="font-medium flex items-center gap-2">
                        <Icon className="text-orange-500" size={18} /> {label}
                      </label>
                      <input
                        type="text"
                        name={name}
                        value={form[name] || ""}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 outline-none"
                      />
                    </div>
                  ))}

                  <div className="col-span-2 flex justify-end mt-6">
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg shadow transition"
                    >
                      <Save size={18} /> Lưu thay đổi
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <Phone className="text-orange-500" />{" "}
                    {user.phone || "Chưa cập nhật"}
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="text-orange-500" />{" "}
                    {user.address || "Chưa cập nhật"}
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="text-orange-500" />{" "}
                    {user.website || "Chưa có website"}
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="text-orange-500" />{" "}
                    {Array.isArray(user.skills)
                      ? user.skills.join(", ")
                      : user.skills || "Chưa có kỹ năng"}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ======================= MESSAGE ============================ */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 bg-white border-l-4 border-orange-500 shadow-lg px-5 py-3 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="text-orange-500" /> {message}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;
