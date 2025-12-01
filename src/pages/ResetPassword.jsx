import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, { password });
      Swal.fire("Thành công!", "Mật khẩu của bạn đã được thay đổi", "success");
      navigate("/login");
    } catch (err) {
      Swal.fire("Lỗi!", err.response?.data?.message || "Token không hợp lệ", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-[380px]">
        <h2 className="text-2xl font-bold text-center text-orange-600 mb-4">
          Đặt lại mật khẩu
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Nhập mật khẩu mới"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-orange-400 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all"
          >
            Cập nhật mật khẩu
          </button>
        </form>
      </div>
    </div>
  );
}
