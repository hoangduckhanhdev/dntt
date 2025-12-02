// src/pages/OrderDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getOrderById } from "../api/ordersApi";
import { API_BASE_URL } from "../api/config";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getOrderById(id);

        const data =
          res?.data?.order ||
          res?.data ||
          res?.order ||
          res || null;

        setOrder(data);
      } catch (e) {
        console.error("❌ Lỗi load đơn hàng:", e);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6">⏳ Đang tải đơn hàng…</div>;
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-500 font-semibold">Không tìm thấy đơn hàng.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-3 text-orange-600 underline"
        >
          ⬅ Quay lại
        </button>
      </div>
    );
  }

  const items = order.items || [];

  const total = items.reduce(
    (sum, i) => sum + Number(i.price || 0) * Number(i.qty || 1),
    0
  );

  const resolveImage = (item) => {
    let img =
      item?.course?.image ||
      item?.course?.thumbnail ||
      item?.thumb ||
      item?.image;

    if (img && !img.startsWith("http")) {
      img = `${API_BASE_URL}${img.startsWith("/") ? "" : "/"}${img}`;
    }

    return img || "https://placehold.co/120x80?text=Course";
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">
        🧾 Chi tiết đơn hàng
      </h1>

      <div className="bg-white rounded-2xl shadow border p-6">
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Mã đơn hàng:{" "}
            <b className="text-slate-900">{order._id || "(không rõ)"}</b>
          </p>

          <p>
            Trạng thái:{" "}
            <b className="text-slate-900">
              {order.status || "pending"}
            </b>
          </p>

          <p>
            Phương thức thanh toán:{" "}
            <b className="text-slate-900">
              {order.paymentMethod || "manual"}
            </b>
          </p>
        </div>

        <div className="mt-5 border-t pt-4 divide-y">
          {items.map((it, index) => {
            const courseTitle =
              it.course?.title ||
              it.title ||
              "Khoá học";

            return (
              <div
                key={index}
                className="py-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={resolveImage(it)}
                    alt="thumb"
                    className="w-20 h-14 rounded-md object-cover border"
                  />

                  <span className="font-medium text-slate-800">
                    {courseTitle} × {it.qty || 1}
                  </span>
                </div>

                <b className="text-orange-700">
                  {(Number(it.price || 0) * Number(it.qty || 1)).toLocaleString(
                    "vi-VN"
                  )}{" "}
                  ₫
                </b>
              </div>
            );
          })}
        </div>

        <div className="text-right mt-5 text-xl font-bold text-orange-600">
          Tổng cộng: {total.toLocaleString("vi-VN")} ₫
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl border text-slate-600 hover:bg-slate-50"
          >
            ⬅ Quay lại
          </button>

          <Link
            to="/my-courses"
            className="px-5 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
          >
            🎓 Xem khoá học của tôi
          </Link>
        </div>
      </div>
    </div>
  );
}
