import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";
import Swal from "sweetalert2";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu không khớp nhau!");
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      await Swal.fire({
        icon: "success",
        title: "Đăng ký thành công!",
        text: "Hãy đăng nhập để tiếp tục nhé 🎉",
        confirmButtonColor: "#f97316",
      });

      navigate("/login");
    } catch (err) {
      const msg = err?.response?.data?.message || "Đăng ký thất bại, thử lại sau!";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-orange-50 to-orange-200">
      <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-2xl w-[400px]">
        <h2 className="text-3xl font-bold text-center text-orange-600 mb-2">
          Tạo tài khoản mới
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Tham gia cộng đồng học tập của chúng tôi
        </p>

        {error && (
          <p className="text-red-500 text-center text-sm mb-3">{error}</p>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          {/* NAME */}
          <div>
            <label className="block text-gray-700 mb-1 text-sm">Họ và tên</label>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              value={form.name}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-gray-700 mb-1 text-sm">Email</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={form.email}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-gray-700 mb-1 text-sm">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none pr-10"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-gray-700 mb-1 text-sm">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              required
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-500 transition-all"
          >
            {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-orange-500 font-semibold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
