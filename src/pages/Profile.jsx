import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Edit,
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
  BookOpen,
  Shield,
  Settings,
  Link2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api/config";

const PROFILE_ENDPOINT = "/profile";

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

  const axiosAuth = axios.create({
    baseURL: `${API_URL}/users`,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  });
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfileAndCourses = async () => {
      try {
        setLoading(true);

        const [profileRes, courseRes] = await Promise.all([
          axiosAuth.get(PROFILE_ENDPOINT),
          axios.get(`${API_URL}/my-courses`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profile = profileRes?.data?.user || profileRes.data || {};
        const courses = courseRes?.data?.courses || [];

        const merged = {
          ...profile,
          totalCourses: courses.length,
        };

        setUser(merged);

        setForm({
          name: merged.name || "",
          phone: merged.phone || "",
          address: merged.address || "",
          website: merged.website || "",
          bio: merged.bio || "",
          skills: Array.isArray(merged.skills)
            ? merged.skills.join(", ")
            : merged.skills || "",
          facebook: merged.facebook || "",
          zalo: merged.zalo || "",
          github: merged.github || "",
          linkedin: merged.linkedin || "",
          jobTitle: merged.jobTitle || "",
          company: merged.company || "",
          goal: merged.goal || "",
          interests: merged.interests || "",
          learningStyle: merged.learningStyle || "",
          birthday: merged.birthday ? merged.birthday.split("T")[0] : "",
        });
      } catch (err) {
        console.error("Lỗi load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndCourses();
  }, []);
  const handleChange = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  const resolveImg = (src, fallback) => {
    if (!src) return fallback;
    if (src.startsWith("http")) return src;
    return `${API_URL.replace("/api", "")}/${src.replace(/^\//, "")}`;
  };
  const handleSave = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    const payload = {
      ...form,
      skills: form.skills
        ? form.skills.split(",").map((s) => s.trim())
        : [],
    };

    Object.keys(payload).forEach((key) => {
      formData.append(key, payload[key]);
    });

    if (avatarFile) formData.append("avatar", avatarFile);
    if (coverFile) formData.append("cover", coverFile);

    try {
      const res = await axiosAuth.put(PROFILE_ENDPOINT, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res?.data?.user || res.data;

      setUser({
        ...updated,
        totalCourses: user.totalCourses, 
      });

      setEditMode(false);
      setMessage("🎉 Hồ sơ đã được cập nhật!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      setMessage("❌ Cập nhật thất bại!");
      setTimeout(() => setMessage(""), 3000);
    }
  };
  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-lg font-semibold text-orange-600">
        ⏳ Đang tải hồ sơ...
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 py-10 flex justify-center px-3 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl bg-white shadow-2xl rounded-3xl overflow-hidden"
      >
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
            alt="cover"
            className="h-64 w-full object-cover"
          />

          {editMode && (
            <label className="absolute top-3 right-3 bg-white px-3 py-2 rounded-lg shadow cursor-pointer text-orange-600 hover:bg-orange-50 flex gap-2 items-center">
              <Upload size={18} /> Ảnh bìa
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setCoverFile(e.target.files[0])}
              />
            </label>
          )}
        </div>

        {/* BODY */}
        <div className="pt-24 px-5 md:px-10 pb-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <h2 className="text-2xl font-semibold flex gap-2 items-center">
              <User className="text-orange-500" /> Hồ sơ học viên
            </h2>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 border border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50"
              >
                <ArrowLeft size={18} className="inline-block mr-2" />
                Về trang chủ
              </button>

              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-lg shadow ${
                  editMode
                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                <Edit size={18} className="inline-block mr-2" />
                {editMode ? "Hủy chỉnh sửa" : "Chỉnh sửa hồ sơ"}
              </button>
            </div>
          </div>

          {/* STATUS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Course Count */}
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 flex gap-3">
              <BookOpen className="text-orange-500" />
              <div>
                <p className="uppercase text-xs text-orange-600">Khóa học đã tham gia</p>
                <p className="text-xl font-bold">
                  {user.totalCourses || 0}{" "}
                  <span className="text-sm text-gray-500">khóa</span>
                </p>
              </div>
            </div>

            {/* Skills */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 flex gap-3">
              <Brain className="text-emerald-500" />
              <div>
                <p className="uppercase text-xs text-emerald-600">Kỹ năng chính</p>
                <p className="text-sm font-semibold">
                  {Array.isArray(user.skills)
                    ? user.skills.slice(0, 3).join(", ") || "Đang cập nhật"
                    : "Đang cập nhật"}
                </p>
              </div>
            </div>

            {/* Account status */}
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4 flex gap-3">
              <Shield className="text-sky-500" />
              <div>
                <p className="uppercase text-xs text-sky-600">Tình trạng tài khoản</p>
                <p className="text-sm font-semibold">Hoạt động tốt</p>
              </div>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={editMode ? "edit" : "view"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {editMode ? (
                <form className="grid md:grid-cols-2 gap-6" onSubmit={handleSave}>
                  <div className="md:col-span-2">
                    <h3 className="text-lg mb-3 flex items-center gap-2">
                      <Phone className="text-orange-500" /> Thông tin liên hệ
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
                        <div key={name}>
                          <label className="flex gap-2 text-sm font-medium">
                            <Icon size={16} className="text-orange-500" /> {label}
                          </label>
                          <input
                            type={type || "text"}
                            name={name}
                            value={form[name] || ""}
                            onChange={handleChange}
                            className="mt-1 border rounded-lg px-3 py-2 w-full"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SCHOOL & JOB */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg mb-3 flex gap-2 items-center">
                      <Settings className="text-orange-500" /> Học tập & nghề nghiệp
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-medium text-sm">Công việc hiện tại</label>
                        <input
                          type="text"
                          name="jobTitle"
                          value={form.jobTitle || ""}
                          onChange={handleChange}
                          className="border rounded-lg px-3 py-2 w-full mt-1"
                        />
                      </div>

                      <div>
                        <label className="font-medium text-sm">Trường / Công ty</label>
                        <input
                          type="text"
                          name="company"
                          value={form.company || ""}
                          onChange={handleChange}
                          className="border rounded-lg px-3 py-2 w-full mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="font-medium text-sm">Mục tiêu học tập</label>
                        <textarea
                          name="goal"
                          value={form.goal || ""}
                          onChange={handleChange}
                          rows={3}
                          className="border rounded-lg px-3 py-2 w-full mt-1"
                        />
                      </div>

                      <div>
                        <label className="font-medium text-sm">Phong cách học</label>
                        <textarea
                          name="learningStyle"
                          value={form.learningStyle || ""}
                          onChange={handleChange}
                          rows={3}
                          className="border rounded-lg px-3 py-2 w-full mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-lg mb-3 flex items-center gap-2">
                      <Info className="text-orange-500" /> Giới thiệu & kỹ năng
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-medium text-sm">Giới thiệu bản thân</label>
                        <textarea
                          name="bio"
                          value={form.bio || ""}
                          onChange={handleChange}
                          rows={4}
                          className="border rounded-lg px-3 py-2 w-full mt-1"
                        />
                      </div>

                      <div>
                        <label className="font-medium text-sm">
                          Kỹ năng (cách nhau bằng dấu phẩy)
                        </label>
                        <textarea
                          name="skills"
                          value={form.skills || ""}
                          onChange={handleChange}
                          rows={4}
                          className="border rounded-lg px-3 py-2 w-full mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-lg mb-3 flex items-center gap-2">
                      <Link2 className="text-orange-500" /> Mạng xã hội
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        "facebook",
                        "zalo",
                        "github",
                        "linkedin",
                        "interests",
                      ].map((name) => (
                        <div key={name} className={name === "interests" ? "md:col-span-2" : ""}>
                          <label className="font-medium text-sm capitalize">
                            {name}
                          </label>
                          <input
                            type="text"
                            name={name}
                            value={form[name] || ""}
                            onChange={handleChange}
                            className="border rounded-lg px-3 py-2 w-full mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end mt-4">
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex gap-2 items-center">
                      <Save size={18} /> Lưu thay đổi
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* LEFT COLUMN */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* CONTACT */}
                    <div className="rounded-2xl border bg-slate-50 px-5 py-4">
                      <h3 className="text-lg mb-3 flex gap-2 items-center">
                        <Phone className="text-orange-500" /> Thông tin liên hệ
                      </h3>

                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Phone size={16} className="text-orange-500" />
                          {user.phone || "Chưa cập nhật"}
                        </div>

                        <div className="flex items-center gap-3">
                          <MapPin size={16} className="text-orange-500" />
                          {user.address || "Chưa cập nhật"}
                        </div>

                        <div className="flex items-center gap-3">
                          <Globe size={16} className="text-orange-500" />
                          {user.website || "Chưa có website"}
                        </div>

                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-orange-500" />
                          {user.birthday
                            ? new Date(user.birthday).toLocaleDateString("vi-VN")
                            : "Chưa cập nhật"}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white px-5 py-4">
                      <h3 className="text-lg mb-3 flex gap-2 items-center">
                        <Settings className="text-orange-500" /> Học tập & nghề nghiệp
                      </h3>

                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-medium">Công việc hiện tại</p>
                          <p className="text-gray-600">{user.jobTitle || "Chưa cập nhật"}</p>
                        </div>

                        <div>
                          <p className="font-medium">Trường / Công ty</p>
                          <p className="text-gray-600">{user.company || "Chưa cập nhật"}</p>
                        </div>

                        <div className="md:col-span-2">
                          <p className="font-medium">Mục tiêu học tập</p>
                          <p className="text-gray-600">
                            {user.goal || "Chưa chia sẻ mục tiêu học tập"}
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <p className="font-medium">Phong cách học</p>
                          <p className="text-gray-600">
                            {user.learningStyle || "Chưa chia sẻ phong cách học"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white px-5 py-4">
                      <h3 className="text-lg mb-3 flex gap-2 items-center">
                        <Info className="text-orange-500" /> Giới thiệu & kỹ năng
                      </h3>

                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-medium">Giới thiệu</p>
                          <p className="text-gray-600">
                            {user.bio || "Chưa cập nhật phần giới thiệu"}
                          </p>
                        </div>

                        <div>
                          <p className="font-medium">Kỹ năng</p>
                          <p className="text-gray-600">
                            {Array.isArray(user.skills)
                              ? user.skills.join(", ")
                              : "Chưa có kỹ năng"}
                          </p>
                        </div>

                        <div>
                          <p className="font-medium">Sở thích</p>
                          <p className="text-gray-600">
                            {user.interests || "Chưa chia sẻ sở thích"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* SOCIAL */}
                    <div className="rounded-2xl border bg-slate-50 px-5 py-4">
                      <h3 className="text-lg mb-3 flex gap-2 items-center">
                        <Link2 className="text-orange-500" /> Mạng xã hội
                      </h3>

                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Facebook: </span>
                          {user.facebook ? (
                            <a className="text-blue-600 underline" href={user.facebook} target="_blank">
                              {user.facebook}
                            </a>
                          ) : (
                            "Chưa cập nhật"
                          )}
                        </p>

                        <p>
                          <span className="font-medium">Zalo: </span>
                          {user.zalo || "Chưa cập nhật"}
                        </p>

                        <p>
                          <span className="font-medium">GitHub: </span>
                          {user.github ? (
                            <a className="text-gray-700 underline" target="_blank" href={user.github}>
                              {user.github}
                            </a>
                          ) : (
                            "Chưa cập nhật"
                          )}
                        </p>

                        <p>
                          <span className="font-medium">LinkedIn: </span>
                          {user.linkedin ? (
                            <a className="text-sky-600 underline" href={user.linkedin} target="_blank">
                              {user.linkedin}
                            </a>
                          ) : (
                            "Chưa cập nhật"
                          )}
                        </p>
                      </div>
                    </div>

                    {/* SECURITY */}
                    <div className="rounded-2xl border bg-white px-5 py-4">
                      <h3 className="text-lg mb-3 flex gap-2 items-center">
                        <Shield className="text-orange-500" /> Bảo mật
                      </h3>

                      <ul className="text-sm space-y-2 text-gray-600">
                        <li>• Email đã xác minh: {user.email ? "Có" : "Không"}</li>
                        <li>• Đăng nhập gần nhất: Không có dữ liệu</li>
                        <li>• Nếu nghi ngờ, hãy đổi mật khẩu.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 bg-white px-5 py-3 rounded-lg border-l-4 border-orange-500 shadow-lg flex gap-3 items-center"
          >
            <CheckCircle className="text-orange-500" />
            {message}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;
