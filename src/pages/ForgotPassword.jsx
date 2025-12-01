import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      Swal.fire("Thành công!", res.data.message, "success");
    } catch (err) {
      Swal.fire("Lỗi!", err.response?.data?.message || "Không gửi được email", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-[380px]">
        <h2 className="text-2xl font-bold text-center text-orange-600 mb-4">
          Quên mật khẩu
        </h2>
        <p className="text-gray-600 text-sm mb-6 text-center">
          Nhập email của bạn để nhận liên kết đặt lại mật khẩu
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="example@gmail.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-orange-400 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all"
          >
            Gửi liên kết
          </button>
        </form>
      </div>
    </div>
  );
}
