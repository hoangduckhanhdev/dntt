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
  Calendar,
  BadgeCheck,
  BookOpen,
  Shield,
  Settings,
  Link2,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api/config";

const ProfilePage = () => {
  const [user, setUser] = useState({});
  const [form, setForm] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Axios cho user, base là /api/users
  const axiosAuth = axios.create({
    baseURL: `${API_URL}/users`, // -> http://localhost:5000/api/users
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  });

  const PROFILE_ENDPOINT = "/profile";

  // ======================= LOAD PROFILE ==========================
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axiosAuth.get(PROFILE_ENDPOINT);
        const data = res?.data?.user || res?.data || {};

        setUser(data);
        setForm({
          // đảm bảo có đủ field cho form
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
          website: data.website || "",
          bio: data.bio || "",
          skills: Array.isArray(data.skills)
            ? data.skills.join(", ")
            : data.skills || "",
          facebook: data.facebook || "",
          zalo: data.zalo || "",
          github: data.github || "",
          linkedin: data.linkedin || "",
          jobTitle: data.jobTitle || "",
          company: data.company || "",
          goal: data.goal || "",
          interests: data.interests || "",
          learningStyle: data.learningStyle || "",
          birthday: data.birthday ? data.birthday.split("T")[0] : "",
        });
      } catch (err) {
        console.error("❌ Lỗi tải hồ sơ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======================= HANDLE INPUT ==========================
  const handleChange = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  // ======================= FORMAT IMG URL ========================
  const resolveImg = (src, fallback) => {
    if (!src) return fallback;
    if (src.startsWith("http")) return src;
    return `${API_URL.replace("/api", "")}/${
      src.startsWith("/") ? src.slice(1) : src
    }`;
  };

  // ======================= SAVE PROFILE ==========================
  const handleSave = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // convert skills từ string → array nếu cần (tuỳ backend)
    const payload = {
      ...form,
      skills: form.skills
        ? form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] !== undefined && payload[key] !== null) {
        formData.append(key, payload[key]);
      }
    });

    if (avatarFile) formData.append("avatar", avatarFile);
    if (coverFile) formData.append("cover", coverFile);

    try {
      const res = await axiosAuth.put(PROFILE_ENDPOINT, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res?.data?.user || res.data;

      setUser(updated);
      setForm({
        ...form,
        ...updated,
        skills: Array.isArray(updated.skills)
          ? updated.skills.join(", ")
          : updated.skills || "",
      });
      setEditMode(false);

      setMessage("🎉 Hồ sơ đã được cập nhật!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      setMessage("❌ Cập nhật thất bại, vui lòng thử lại!");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-primary font-semibold">
          ⏳ Đang tải hồ sơ...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 py-10 flex justify-center px-3 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl bg-white shadow-2xl rounded-3xl overflow-hidden relative"
      >
        {/* ====================== COVER + AVATAR ==================== */}
        <div className="relative">
          <img
            src={
              coverFile
                ? URL.createObjectURL(coverFile)
                : resolveImg(
                    user.cover,
                    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80"
                  )
            }
            className="h-64 w-full object-cover"
            alt="cover"
          />

          {editMode && (
            <label className="absolute top-3 right-3 bg-white/95 px-3 py-2 rounded-lg shadow flex items-center gap-2 cursor-pointer text-orange-600 font-medium hover:bg-orange-50 transition">
              <Upload size={18} /> Ảnh bìa
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setCoverFile(e.target.files[0])}
              />
            </label>
          )}

          <div className="absolute -bottom-20 left-8 md:left-14 flex flex-col md:flex-row md:items-end gap-5 md:gap-6">
            <div className="relative">
              <img
                src={
                  avatarFile
                    ? URL.createObjectURL(avatarFile)
                    : resolveImg(
                        user.avatar,
                        "https://api.dicebear.com/7.x/initials/svg?seed=HK"
                      )
                }
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl object-cover bg-slate-100"
                alt="avatar"
              />

              {editMode && (
                <label className="absolute bottom-2 right-2 bg-orange-500 p-2 rounded-full cursor-pointer shadow-md hover:bg-orange-600 transition">
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

            <div className="pb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="text-orange-500" size={22} />
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    className="border-b border-gray-300 focus:border-orange-500 outline-none bg-transparent text-2xl md:text-3xl font-bold"
                    value={form.name || ""}
                    onChange={handleChange}
                  />
                ) : (
                  user.name || "Người dùng"
                )}
              </h1>

              <p className="text-gray-600 mt-1 flex items-center gap-2 text-sm md:text-base">
                <Mail size={16} /> {user.email}
              </p>
              <p className="text-gray-600 mt-1 flex items-center gap-2 text-sm md:text-base">
                <BadgeCheck size={16} className="text-emerald-500" />
                Thành viên từ{" "}
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* ======================= BODY ============================ */}
        <div className="pt-24 px-5 md:px-10 pb-10">
          {/* Header actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <User className="text-orange-500" /> Hồ sơ học viên
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 border border-orange-300 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-50 transition shadow-sm text-sm md:text-base"
              >
                <ArrowLeft size={18} /> Về trang chủ
              </button>

              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow text-sm md:text-base transition ${
                  editMode
                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                <Edit size={18} />
                {editMode ? "Hủy chỉnh sửa" : "Chỉnh sửa hồ sơ"}
              </button>
            </div>
          </div>

          {/* ============== STATS CARDS (mock) ===================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 flex items-center gap-3">
              <BookOpen className="text-orange-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-orange-600">
                  Khóa học đã tham gia
                </p>
                <p className="text-xl font-bold">
                  {user.totalCourses || 0}
                  <span className="text-sm font-medium text-gray-500 ml-1">
                    khóa
                  </span>
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 flex items-center gap-3">
              <Brain className="text-emerald-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-600">
                  Kỹ năng chính
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {Array.isArray(user.skills)
                    ? user.skills.slice(0, 3).join(", ") || "Đang cập nhật"
                    : user.skills || "Đang cập nhật"}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4 flex items-center gap-3">
              <Shield className="text-sky-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-sky-600">
                  Tình trạng tài khoản
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  Hoạt động tốt
                </p>
              </div>
            </div>
          </div>

          {/* ======================= MAIN CONTENT =================== */}
          <AnimatePresence mode="wait">
            <motion.div
              key={editMode ? "edit" : "view"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {editMode ? (
                // ================== EDIT MODE ========================
                <form
                  className="grid md:grid-cols-2 gap-6"
                  onSubmit={handleSave}
                >
                  {/* Thông tin liên hệ */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Phone className="text-orange-500" size={18} />
                      Thông tin liên hệ
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { name: "phone", label: "Số điện thoại", icon: Phone },
                        { name: "address", label: "Địa chỉ", icon: MapPin },
                        { name: "website", label: "Website", icon: Globe },
                        {
                          name: "birthday",
                          label: "Ngày sinh",
                          icon: Calendar,
                          type: "date",
                        },
                      ].map(({ name, label, icon: Icon, type }) => (
                        <div className="flex flex-col gap-1" key={name}>
                          <label className="font-medium flex items-center gap-2 text-sm">
                            <Icon className="text-orange-500" size={17} />{" "}
                            {label}
                          </label>
                          <input
                            type={type || "text"}
                            name={name}
                            value={form[name] || ""}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 outline-none text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nghề nghiệp & mục tiêu */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Settings className="text-orange-500" size={18} />
                      Thông tin học tập & nghề nghiệp
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { name: "jobTitle", label: "Công việc hiện tại" },
                        { name: "company", label: "Trường / Công ty" },
                      ].map(({ name, label }) => (
                        <div className="flex flex-col gap-1" key={name}>
                          <label className="font-medium text-sm">{label}</label>
                          <input
                            type="text"
                            name={name}
                            value={form[name] || ""}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 outline-none text-sm"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      {[
                        {
                          name: "goal",
                          label: "Mục tiêu học tập",
                          placeholder:
                            "Ví dụ: Thành thạo React, chuẩn bị phỏng vấn fresher...",
                        },
                        {
                          name: "learningStyle",
                          label: "Phong cách học",
                          placeholder:
                            "Ví dụ: Tự học, thích làm project thực tế, học qua video...",
                        },
                      ].map(({ name, label, placeholder }) => (
                        <div className="flex flex-col gap-1" key={name}>
                          <label className="font-medium text-sm">{label}</label>
                          <textarea
                            name={name}
                            value={form[name] || ""}
                            onChange={handleChange}
                            rows={3}
                            placeholder={placeholder}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 outline-none text-sm resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Giới thiệu & kỹ năng */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Info className="text-orange-500" size={18} />
                      Giới thiệu & kỹ năng
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="font-medium text-sm">
                          Giới thiệu bản thân
                        </label>
                        <textarea
                          name="bio"
                          value={form.bio || ""}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Hãy chia sẻ đôi chút về bản thân, kinh nghiệm, sở thích..."
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 outline-none text-sm resize-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-medium text-sm">
                          Kỹ năng (ngăn cách bằng dấu phẩy)
                        </label>
                        <textarea
                          name="skills"
                          value={form.skills || ""}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Ví dụ: HTML, CSS, JavaScript, React, NodeJS..."
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 outline-none text-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mạng xã hội */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Link2 className="text-orange-500" size={18} />
                      Mạng xã hội & liên hệ khác
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { name: "facebook", label: "Facebook URL" },
                        { name: "zalo", label: "Zalo / Số Zalo" },
                        { name: "github", label: "GitHub URL" },
                        { name: "linkedin", label: "LinkedIn URL" },
                        {
                          name: "interests",
                          label: "Sở thích",
                          textarea: true,
                        },
                      ].map(({ name, label, textarea }) =>
                        textarea ? (
                          <div
                            className="flex flex-col gap-1 md:col-span-2"
                            key={name}
                          >
                            <label className="font-medium text-sm">
                              {label}
                            </label>
                            <textarea
                              name={name}
                              value={form[name] || ""}
                              onChange={handleChange}
                              rows={3}
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 outline-none text-sm resize-none"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1" key={name}>
                            <label className="font-medium text-sm">
                              {label}
                            </label>
                            <input
                              type="text"
                              name={name}
                              value={form[name] || ""}
                              onChange={handleChange}
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 outline-none text-sm"
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end mt-4">
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg shadow transition"
                    >
                      <Save size={18} /> Lưu thay đổi
                    </button>
                  </div>
                </form>
              ) : (
                // ================== VIEW MODE ========================
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Cột 1: Thông tin liên hệ */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-gray-100 bg-slate-50/60 px-5 py-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Phone className="text-orange-500" size={18} />
                        Thông tin liên hệ
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Phone className="text-orange-500" size={16} />
                          {user.phone || "Chưa cập nhật số điện thoại"}
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="text-orange-500" size={16} />
                          {user.address || "Chưa cập nhật địa chỉ"}
                        </div>
                        <div className="flex items-center gap-3">
                          <Globe className="text-orange-500" size={16} />
                          {user.website || "Chưa có website"}
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="text-orange-500" size={16} />
                          {user.birthday
                            ? new Date(user.birthday).toLocaleDateString(
                                "vi-VN"
                              )
                            : "Chưa cập nhật ngày sinh"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Settings className="text-orange-500" size={18} />
                        Học tập & nghề nghiệp
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">
                            Công việc hiện tại
                          </p>
                          <p className="text-gray-600 mt-1">
                            {user.jobTitle || "Chưa cập nhật"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            Trường / Công ty
                          </p>
                          <p className="text-gray-600 mt-1">
                            {user.company || "Chưa cập nhật"}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-medium text-gray-700">
                            Mục tiêu học tập
                          </p>
                          <p className="text-gray-600 mt-1">
                            {user.goal || "Chưa chia sẻ mục tiêu học tập."}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-medium text-gray-700">
                            Phong cách học
                          </p>
                          <p className="text-gray-600 mt-1">
                            {user.learningStyle ||
                              "Chưa chia sẻ phong cách học ưa thích."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Info className="text-orange-500" size={18} />
                        Giới thiệu & kỹ năng
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">
                            Giới thiệu bản thân
                          </p>
                          <p className="text-gray-600 mt-1">
                            {user.bio ||
                              "Bạn chưa cập nhật phần giới thiệu. Hãy thêm thông tin để giảng viên và bạn học hiểu rõ hơn về bạn."}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Kỹ năng</p>
                          <p className="text-gray-600 mt-1">
                            {Array.isArray(user.skills)
                              ? user.skills.join(", ") || "Chưa có kỹ năng"
                              : user.skills || "Chưa có kỹ năng"}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">
                            Sở thích
                          </p>
                          <p className="text-gray-600 mt-1">
                            {user.interests || "Chưa chia sẻ sở thích."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột 2: Mạng xã hội & bảo mật */}
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-100 bg-slate-50 px-5 py-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Link2 className="text-orange-500" size={18} />
                        Mạng xã hội
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Facebook:</span>{" "}
                          {user.facebook ? (
                            <a
                              href={user.facebook}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline break-all"
                            >
                              {user.facebook}
                            </a>
                          ) : (
                            "Chưa cập nhật"
                          )}
                        </p>
                        <p>
                          <span className="font-medium">Zalo:</span>{" "}
                          {user.zalo || "Chưa cập nhật"}
                        </p>
                        <p>
                          <span className="font-medium">GitHub:</span>{" "}
                          {user.github ? (
                            <a
                              href={user.github}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-800 hover:underline break-all"
                            >
                              {user.github}
                            </a>
                          ) : (
                            "Chưa cập nhật"
                          )}
                        </p>
                        <p>
                          <span className="font-medium">LinkedIn:</span>{" "}
                          {user.linkedin ? (
                            <a
                              href={user.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-700 hover:underline break-all"
                            >
                              {user.linkedin}
                            </a>
                          ) : (
                            "Chưa cập nhật"
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Shield className="text-orange-500" size={18} />
                        Bảo mật & tài khoản
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Email đã xác minh: {user.email ? "Có" : "Không"}</li>
                        <li>
                          • Đăng nhập gần nhất: Không có dữ liệu (demo).
                        </li>
                        <li>
                          • Nếu bạn thấy hoạt động bất thường, hãy đổi mật khẩu
                          trên trang đăng nhập.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ======================= MESSAGE ========================= */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 bg-white border-l-4 border-orange-500 shadow-lg px-5 py-3 rounded-lg flex items-center gap-3 z-[999]"
          >
            <CheckCircle className="text-orange-500" /> {message}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;
