import React, { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

export default function RegisterFail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const cancel = params.get("cancel") === "true"; // PayOS trả về theo cancelUrl
    const orderCode = params.get("orderCode") || "";

    // Chỉ điều hướng nếu đúng là hủy; delay nhẹ giúp render thông báo 1 khung hình
    const t = setTimeout(() => {
      if (cancel) navigate("/courses", { replace: true });
      else navigate("/", { replace: true });
    }, 150);
    return () => clearTimeout(t);
  }, [navigate, params]);

  // Fallback trong lúc chờ điều hướng (hoặc nếu popstate bị chặn)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-white text-gray-700">
      <p className="mb-4 text-lg">Bạn đã hủy giao dịch. Đang quay về trang khóa học…</p>
      <Link to="/courses" className="px-4 py-2 rounded-lg bg-orange-500 text-white">
        Về trang Khóa học
      </Link>
    </div>
  );
}
