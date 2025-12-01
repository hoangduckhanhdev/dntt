import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getOrderById } from "../api/ordersApi"; // cần hàm này trong ordersApi

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getOrderById(id);
        setOrder(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6">Đang tải đơn hàng…</div>;
  }
  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        Không tìm thấy đơn hàng.
        <button onClick={() => navigate(-1)} className="ml-3 text-orange-600 underline">
          Quay lại
        </button>
      </div>
    );
  }

  const total = order.items?.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 1), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Chi tiết đơn hàng</h1>
      <div className="rounded-2xl border p-4 bg-white">
        <p className="text-sm text-slate-600">
          Mã đơn: <b className="text-slate-800">{order._id}</b>
        </p>
        <p className="text-sm text-slate-600">
          Trạng thái: <b className="text-slate-800">{order.status || "pending"}</b>
        </p>
        <p className="text-sm text-slate-600">
          Phương thức: <b className="text-slate-800">{order.paymentMethod || "manual"}</b>
        </p>

        <div className="mt-4 divide-y">
          {order.items?.map((it) => (
            <div key={it.course?._id || it.course} className="py-3 flex justify-between">
              <span>
                {it.course?.title || it.title || "Khoá học"} × {it.qty || 1}
              </span>
              <b>{(Number(it.price || 0) * Number(it.qty || 1)).toLocaleString("vi-VN")} ₫</b>
            </div>
          ))}
        </div>

        <div className="text-right mt-4 font-bold text-lg text-orange-700">
          Tổng cộng: {total.toLocaleString("vi-VN")} ₫
        </div>

        <div className="mt-4">
          <Link to="/" className="text-orange-600 underline">Về trang chủ</Link>
        </div>
      </div>
    </div>
  );
}
