// src/pages/RegisterSuccess.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, Link } from "react-router-dom";

export default function RegisterSuccess() {
  const [params] = useSearchParams();
  const orderCode = params.get("orderCode");

  const [msg, setMsg] = useState("⏳ Đang xác nhận thanh toán...");
  const [success, setSuccess] = useState(null); // true | false | null (đang chờ)

  useEffect(() => {
    let stopped = false;
    let timer;

    const syncThenCheck = async () => {
      if (!orderCode) {
        setMsg("❌ Thiếu orderCode trong URL.");
        setSuccess(false);
        return;
      }

      try {
        // 1) Đồng bộ với PayOS (cập nhật DB nếu đã PAID)
        await axios.get("http://localhost:5000/api/payments/confirm-return", {
          params: { orderCode },
        });
      } catch (e) {
        // Không sao, vẫn chuyển sang bước check-status
        console.warn("confirm-return warning:", e?.response?.data || e.message);
      }

      // 2) Poll check-status 6 lần (mỗi 1.5s)
      const MAX_TRIES = 6;
      const DELAY = 1500;

      let tries = 0;
      const poll = async () => {
        if (stopped) return;

        try {
          const res = await axios.get(
            "http://localhost:5000/api/payments/check-status",
            { params: { orderCode } }
          );

          if (res.data?.status === "paid") {
            setMsg("🎉 Thanh toán thành công! Bạn đã đăng ký học thành công!");
            setSuccess(true);
            return; // xong, dừng poll
          }
        } catch (err) {
          console.warn("check-status error:", err?.response?.data || err.message);
        }

        tries += 1;
        if (tries >= MAX_TRIES) {
          setMsg("⚠️ Thanh toán chưa hoàn tất, vui lòng thử lại!");
          setSuccess(false);
          return;
        }

        timer = setTimeout(poll, DELAY);
      };

      poll();
    };

    syncThenCheck();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderCode]);

  return (
    <div
      className={`h-screen flex flex-col items-center justify-center text-white transition-all duration-500 ${
        success === null
          ? "bg-gradient-to-r from-yellow-400 to-orange-500"
          : success
          ? "bg-gradient-to-r from-green-500 to-emerald-600"
          : "bg-gradient-to-r from-red-500 to-rose-600"
      }`}
    >
      <h1 className="text-4xl font-bold mb-4 text-center px-4">{msg}</h1>

      <div className="flex gap-3">
        <Link
          to="/courses"
          className="bg-white text-gray-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Về trang Khóa học
        </Link>
        <Link
          to="/"
          className="bg-white/90 text-gray-700 px-5 py-2 rounded-lg font-semibold hover:bg-white transition"
        >
          Trang chủ
        </Link>
      </div>

      {orderCode && (
        <p className="mt-4 opacity-90 text-sm">
          Mã đơn hàng: <b className="underline">{orderCode}</b>
        </p>
      )}
    </div>
  );
}
