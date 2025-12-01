import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function ThankYou() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const orderId = params.get("order");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow p-8 text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Đặt hàng thành công!</h1>
        <p className="text-slate-600 mt-2">
          Cảm ơn bạn đã tin tưởng. Chúng tôi đã ghi nhận đơn của bạn.
        </p>

        {orderId ? (
          <p className="mt-2 text-sm text-slate-500">
            Mã đơn của bạn: <b className="text-slate-800">{orderId}</b>
          </p>
        ) : null}

        <div className="mt-6 flex gap-3 justify-center">
          {orderId && (
            <Link
              to={`/orders/${orderId}`}
              className="px-4 py-2 rounded-xl border border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              Xem chi tiết đơn
            </Link>
          )}
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600"
          >
            Về trang chủ
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Nếu cần hỗ trợ, liên hệ fanpage hoặc email hỗ trợ trên website.
        </p>
      </div>
    </div>
  );
}
