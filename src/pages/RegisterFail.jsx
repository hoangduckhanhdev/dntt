import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

export default function RegisterFail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const cancel = params.get("cancel") === "true";
    const orderCode = params.get("orderCode") || "";

    // Hiển thị UI khoảng 1.2s cho người dùng đọc thông tin
    setRedirecting(true);

    const timer = setTimeout(() => {
      if (cancel) {
        navigate("/courses", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigate, params]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-white text-gray-700 px-4 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Giao dịch thất bại</h1>

      <p className="text-lg mb-2">Bạn đã hủy thanh toán hoặc giao dịch không thành công.</p>
      <p className="text-sm text-gray-500 mb-6">
        Hệ thống đang điều hướng bạn trở lại…
      </p>

      <Link
        to="/courses"
        className="px-5 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold shadow-md hover:bg-orange-600 transition"
      >
        Về trang Khóa học
      </Link>

      {redirecting && (
        <div className="mt-6 text-sm text-gray-500 animate-pulse">
          Đang điều hướng…
        </div>
      )}
    </div>
  );
}
