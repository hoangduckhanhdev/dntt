// src/pages/admin/AdminOrders.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/* ===== Helpers ===== */
const API = (import.meta?.env?.VITE_API_URL || "http://localhost:5000") + "/api";

const formatVND = (n) => Number(n || 0).toLocaleString("vi-VN") + " đ";
const formatDate = (d) =>
  new Date(d).toLocaleString("vi-VN", { hour12: false });

/* Trạng thái hiển thị đẹp + tiếng Việt */
const STATUS_OPTIONS = [
  { value: "pending", label: "Đang chờ", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "paid", label: "Đã thanh toán", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "cancelled", label: "Đã huỷ", color: "bg-zinc-100 text-zinc-700 border-zinc-200" },
  { value: "failed", label: "Thất bại", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { value: "refunded", label: "Hoàn tiền", color: "bg-sky-100 text-sky-700 border-sky-200" },
];
const statusMeta = (val) => STATUS_OPTIONS.find((s) => s.value === val) || STATUS_OPTIONS[0];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // UI state
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [draftStatuses, setDraftStatuses] = useState({}); // id -> status tạm thời

  /* ===== Fetch ===== */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/orders`);
      const data = Array.isArray(res.data) ? res.data : res.data?.orders || [];
      setOrders(data);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách đơn hàng:", err);
      alert("Không tải được danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const applyUpdateStatus = async (id, nextStatus) => {
    try {
      setUpdatingId(id);
      // Giữ nguyên PATCH như API bạn đang dùng
      await axios.patch(`${API}/orders/${id}/status`, { status: nextStatus });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status: nextStatus } : o)));
      alert("✅ Cập nhật trạng thái thành công!");
    } catch (err) {
      console.error("❌ Lỗi cập nhật trạng thái:", err);
      alert("Không thể cập nhật trạng thái!");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ===== Tìm kiếm + lọc ===== */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const okStatus = filter === "all" ? true : o.status === filter;
      const str = `${o?.customerName || o?.user?.name || ""} ${o?.email || o?.user?.email || ""} ${o?.transactionId || ""}`.toLowerCase();
      const okQuery = q ? str.includes(q) : true;
      return okStatus && okQuery;
    });
  }, [orders, query, filter]);

  const totalAmount = useMemo(
    () => filtered.reduce((s, o) => s + Number(o.total || 0), 0),
    [filtered]
  );

  const handleDraftChange = (id, value) =>
    setDraftStatuses((prev) => ({ ...prev, [id]: value }));

  return (
    <div className="px-4 md:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý đơn hàng</h1>
          <p className="text-slate-500">Theo dõi và cập nhật trạng thái thanh toán của học viên.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo người mua, email, mã đơn…"
              className="w-full sm:w-72 rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {query && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                onClick={() => setQuery("")}
                title="Xoá tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
          <div className="text-sm text-indigo-600">Tổng đơn (đang lọc)</div>
          <div className="text-2xl font-bold text-indigo-700">{filtered.length}</div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
          <div className="text-sm text-emerald-600">Tổng tiền (đang lọc)</div>
          <div className="text-2xl font-bold text-emerald-700">{formatVND(totalAmount)}</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
          <div className="text-sm text-amber-600">Đã thanh toán</div>
          <div className="text-2xl font-bold text-amber-700">
            {filtered.filter((o) => o.status === "paid").length}
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block rounded-2xl border border-slate-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="px-5 py-3 font-semibold text-slate-600">Người mua</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Sản phẩm</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Tổng tiền</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Trạng thái</th>
              <th className="px-5 py-3 font-semibold text-slate-600">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Đang tải…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Không có đơn nào.</td></tr>
            ) : (
              filtered.map((o) => {
                const meta = statusMeta(o.status);
                const draft = draftStatuses[o._id] ?? o.status;
                const metaDraft = statusMeta(draft);

                return (
                  <tr key={o._id} className="border-t">
                    {/* Người mua */}
                    <td className="px-5 py-4 align-top">
                      <div className="font-semibold text-slate-800">
                        {o.customerName || o.user?.name || "—"}
                      </div>
                      <div className="text-xs text-slate-500">{o.email || o.user?.email || "—"}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Mã đơn: <span className="font-medium">{o.transactionId || "—"}</span>
                      </div>
                      <div className="text-xs text-slate-500">Lúc: {formatDate(o.createdAt)}</div>
                    </td>

                    {/* Sản phẩm */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        {o.items?.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            {it.courseImage ? (
                              <img
                                src={it.courseImage}
                                className="w-12 h-9 object-cover rounded border"
                                alt=""
                              />
                            ) : (
                              <div className="w-12 h-9 rounded bg-orange-100 text-orange-700 grid place-items-center text-xs font-semibold">
                                {(it.courseTitle || it.title || "KH").slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="truncate font-medium text-slate-800">
                                {it.courseTitle || it.title || "Khoá học"}
                              </div>
                              <div className="text-xs text-slate-500">
                                x{it.qty || 1} • {formatVND(it.price)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Tổng tiền */}
                    <td className="px-5 py-4 align-top font-semibold text-orange-600">
                      {formatVND(o.total)}
                    </td>

                    {/* Trạng thái hiện tại */}
                    <td className="px-5 py-4 align-top">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <select
                          className="rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
                          value={draft}
                          onChange={(e) => handleDraftChange(o._id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => applyUpdateStatus(o._id, draft)}
                          disabled={updatingId === o._id || draft === o.status}
                          className="rounded-lg bg-indigo-600 text-white px-3 py-2 font-medium hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {updatingId === o._id ? "Đang lưu..." : "Cập nhật"}
                        </button>
                      </div>

                      {draft !== o.status && (
                        <div className="mt-2 text-xs">
                          <span className="text-slate-500 mr-1">Sẽ đổi thành:</span>
                          <span className={`inline-flex px-2 py-0.5 rounded-full border ${metaDraft.color}`}>
                            {metaDraft.label}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet cards */}
      <div className="lg:hidden space-y-4">
        {loading ? (
          <div className="rounded-2xl border p-6 text-center text-slate-500 bg-white">Đang tải…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border p-6 text-center text-slate-500 bg-white">Không có đơn nào.</div>
        ) : (
          filtered.map((o) => {
            const meta = statusMeta(o.status);
            const draft = draftStatuses[o._id] ?? o.status;
            const metaDraft = statusMeta(draft);

            return (
              <div key={o._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-800">
                      {o.customerName || o.user?.name || "—"}
                    </div>
                    <div className="text-xs text-slate-500">{o.email || o.user?.email || "—"}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Mã đơn: <b>{o.transactionId || "—"}</b>
                    </div>
                    <div className="text-xs text-slate-500">Lúc: {formatDate(o.createdAt)}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {o.items?.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      {it.courseImage ? (
                        <img
                          src={it.courseImage}
                          className="w-12 h-9 object-cover rounded border"
                          alt=""
                        />
                      ) : (
                        <div className="w-12 h-9 rounded bg-orange-100 text-orange-700 grid place-items-center text-xs font-semibold">
                          {(it.courseTitle || it.title || "KH").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-800">{it.courseTitle || it.title || "Khoá học"}</div>
                        <div className="text-xs text-slate-500">x{it.qty || 1} • {formatVND(it.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Tổng: <b className="text-orange-600">{formatVND(o.total)}</b>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-lg border border-slate-200 px-3 py-2"
                      value={draft}
                      onChange={(e) => handleDraftChange(o._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => applyUpdateStatus(o._id, draft)}
                      disabled={updatingId === o._id || draft === o.status}
                      className="rounded-lg bg-indigo-600 text-white px-3 py-2 font-medium disabled:opacity-60"
                    >
                      {updatingId === o._id ? "Lưu..." : "Cập nhật"}
                    </button>
                  </div>
                </div>

                {draft !== o.status && (
                  <div className="mt-2 text-xs">
                    <span className="text-slate-500 mr-1">Sẽ đổi thành:</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full border ${metaDraft.color}`}>
                      {metaDraft.label}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
