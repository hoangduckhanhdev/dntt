import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../api/authApi";
import Swal from "sweetalert2";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // ?redirect=/checkout (mặc định "/")
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect") || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginUser(form);

      // --- Chuẩn hoá user: đảm bảo luôn có _id ---
      const rawUser = res?.data?.user || {};
      const normalizedUser = {
        ...rawUser,
        _id: rawUser._id || rawUser.id || rawUser.userId, // nhận cả id/userId
      };

      // Lưu token + user
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      localStorage.setItem("role", normalizedUser.role || "");

      await Swal.fire({
        icon: "success",
        title: "Đăng nhập thành công!",
        text: `Chào mừng ${normalizedUser.name || "bạn"} trở lại 🎉`,
        confirmButtonColor: "#f97316",
        timer: 2000,
        showConfirmButton: false,
      });

      navigate(redirect, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Sai email hoặc mật khẩu";
      setError(msg);
      Swal.fire({
        icon: "error",
        title: "Đăng nhập thất bại",
        text: msg,
        confirmButtonColor: "#f87171",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // truyền kèm redirect để quay lại đúng trang sau OAuth
    window.location.href =
      `http://localhost:5000/api/auth/google?redirect=${encodeURIComponent(redirect)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-orange-50 to-orange-200">
      <div className="bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-2xl w-[380px]">
        <h2 className="text-3xl font-bold text-center text-orange-600 mb-2">Chào mừng trở lại</h2>
        <p className="text-center text-gray-600 mb-8">Đăng nhập vào tài khoản của bạn</p>

        {error && <p className="text-red-500 text-center text-sm mb-3">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 mb-1 text-sm">Email</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1 text-sm">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
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

          <div className="flex items-center justify-between text-sm text-gray-600">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="accent-orange-500" />
              <span>Ghi nhớ tôi</span>
            </label>
            <a href="/forgot-password" className="text-orange-500 hover:underline">Quên mật khẩu?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-500 transition-all"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">hoặc tiếp tục với</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-orange-50 transition-all shadow-sm"
          >
            <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" className="w-5 h-5" />
            <span className="text-gray-700 font-medium">Đăng nhập với Google</span>
          </button>
        </div>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-orange-500 font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
