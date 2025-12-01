import React from "react";
import { Link, useNavigate } from "react-router-dom";

/* ========= Helpers ========= */
function formatCompact(n = 0) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(v % 1_000 ? 1 : 0) + "K";
  return v.toString();
}

function Stars({ value = 0 }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div className="flex items-center gap-1 text-xs">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-4 w-4 ${i < Math.round(v) ? "fill-orange-500" : "fill-orange-200"}`}
        >
          <path d="M10 15.27l-5.18 3.05 1.58-5.64L1 7.97l5.91-.51L10 2l3.09 5.46 5.91.51-5.4 4.71 1.58 5.64z" />
        </svg>
      ))}
      <span className="ml-1 text-gray-500">{v.toFixed(1)}</span>
    </div>
  );
}

/**
 * CourseCard
 * - Nhận thêm props tuỳ chọn:
 *    onAddToCart?: (course) => void   // gọi khi bấm “Thêm giỏ”
 *    showAddToCart?: boolean          // bật/tắt nút thêm giỏ
 *    liveStudents?: number            // nếu muốn ép số HV (ví dụ vừa thanh toán xong), sẽ ưu tiên hiển thị số này
 */
export default function CourseCard({ course = {}, onAddToCart, showAddToCart = true, liveStudents }) {
  const navigate = useNavigate();

  const {
    _id,
    name,
    title,
    image,
    teacher,
    price,
    oldPrice,              // NOTE: nếu có giá gạch
    category,
    description,
    rating,
    stars,
    students,
    enrolled,
    duration,
    level,
    createdAt,            // NOTE: dùng để gắn badge "Mới"
  } = course;

  const courseId = _id;
  const courseTitle = title || name || "Khoá học";
  const teacherName = teacher?.name || (typeof teacher === "string" ? teacher : "Đang cập nhật");

  const priceNumber = typeof price === "number" ? price : 0;
  const priceText = priceNumber > 0 ? `${priceNumber.toLocaleString("vi-VN")} ₫` : "Miễn phí";
  const oldPriceNumber = typeof oldPrice === "number" ? oldPrice : undefined;
  const hasDiscount = oldPriceNumber && oldPriceNumber > priceNumber;

  // NOTE: ưu tiên liveStudents nếu truyền từ ngoài vào (để số HV “nhảy” ngay)
  const studentCount =
    typeof liveStudents === "number"
      ? liveStudents
      : typeof students === "number"
      ? students
      : typeof enrolled === "number"
      ? enrolled
      : 0;

  const rateValue =
    typeof rating === "number" ? rating : typeof stars === "number" ? stars : 0;

  const isNew =
    createdAt && Date.now() - new Date(createdAt).getTime() < 1000 * 60 * 60 * 24 * 30; // < 30 ngày

  const goDetail = () => {
    if (courseId) navigate(`/course/${courseId}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart({
        _id: courseId,
        title: courseTitle,
        price: priceNumber,
        qty: 1,
        thumb: image,
      });
    } else {
      // fallback: tự ghi vào localStorage nếu chưa truyền callback
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const idx = cart.findIndex((x) => x._id === courseId);
        if (idx >= 0) cart[idx].qty += 1;
        else
          cart.push({
            _id: courseId,
            title: courseTitle,
            price: priceNumber,
            qty: 1,
            thumb: image,
          });
        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("cartUpdated")); // để badge giỏ nhảy số
      } catch {}
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goDetail}
      onKeyDown={(e) => (e.key === "Enter" ? goDetail() : null)}
      className="group relative rounded-2xl bg-white ring-1 ring-orange-100 hover:ring-orange-200 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative">
        <img
          src={image || "https://placehold.co/640x360?text=No+Image"}
          alt={courseTitle}
          loading="lazy"
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/640x360?text=No+Image";
          }}
        />

        {/* Badge danh mục */}
        {(category?.name || category) && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 text-orange-700 ring-1 ring-orange-200 px-3 py-1 text-[11px] font-medium backdrop-blur">
            {category?.name || category}
          </span>
        )}

        {/* Badge Mới / Bán chạy */}
        <div className="absolute right-3 top-3 flex gap-2">
          {isNew && (
            <span className="rounded-full bg-green-600 text-white px-2.5 py-1 text-[11px] font-semibold shadow">
              Mới
            </span>
          )}
          {studentCount >= 100 && (
            <span className="rounded-full bg-orange-600 text-white px-2.5 py-1 text-[11px] font-semibold shadow">
              Bán chạy
            </span>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/0 via-black/0 to-black/0 group-hover:from-black/[0.03] transition-colors" />
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {courseTitle}
        </h3>

        <div className="mt-1 text-sm text-gray-500">👨‍🏫 {teacherName}</div>

        {/* Stats row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Stars value={rateValue} />
          <div className="text-xs text-gray-600">
            👥 {formatCompact(studentCount)} học viên
          </div>
          {duration && <div className="text-xs text-gray-600">⏱️ {duration}</div>}
          {level && (
            <span className="text-xs rounded-full bg-orange-50 text-orange-700 px-2.5 py-1 ring-1 ring-orange-100">
              {level}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">{description}</p>
        )}

        {/* Price + Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-orange-600 font-bold">{priceText}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {oldPriceNumber.toLocaleString("vi-VN")} ₫
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Xem chi tiết */}
            <Link
              to={`/course/${courseId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium ring-1 ring-orange-200 bg-white text-orange-600 hover:bg-orange-50 hover:ring-orange-300 transition-all"
            >
              Chi tiết
            </Link>

            {/* Đăng ký */}
            <Link
              to={`/registercourse/${courseId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 hover:shadow-md active:scale-[0.98] transition-all"
            >
              Đăng ký
            </Link>

            {/* Thêm giỏ (tuỳ chọn) */}
            {showAddToCart && (
              <button
                onClick={handleAddToCart}
                className="inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-medium ring-1 ring-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:ring-gray-300 transition-all"
                title="Thêm vào giỏ"
              >
                + Giỏ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Border glow khi hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 group-hover:ring-orange-100/80 transition-all" />
    </div>
  );
}
