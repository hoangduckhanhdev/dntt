// src/pages/CourseDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AiFillStar } from "react-icons/ai";
import { API_URL } from "../api/config"; // ✅ dùng config chung

/* =========================
   Helpers
========================= */
const extractYouTubeId = (input = "") => {
  if (!input) return "";
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^m\./, "");

    if (host.includes("youtu.be")) {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return id;
    }
    const v = url.searchParams.get("v");
    if (v) return v;

    const m = url.pathname.match(/\/(embed|shorts|live|v)\/([^/?#]+)/i);
    if (m?.[2]) return m[2];

    return "";
  } catch {
    return (input || "").split(/[?#&]/)[0];
  }
};

const toYouTubeEmbed = (input = "") => {
  const raw = extractYouTubeId(input);
  const id = (raw || "").replace(/[^a-zA-Z0-9_-]/g, "");
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
};

const Stars = ({ value = 0, size = 18, className = "" }) => {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div className={`flex items-center ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <AiFillStar
          key={i}
          size={size}
          className={i < Math.round(v) ? "text-yellow-400" : "text-gray-300"}
        />
      ))}
      <span className="ml-2 text-sm text-slate-600">{v.toFixed(1)}</span>
    </div>
  );
};

/* =========================
   Star selector để gửi đánh giá
========================= */
const StarSelector = ({ value = 5, onChange }) => {
  const [hover, setHover] = useState(0);
  const stars = [1, 2, 3, 4, 5];
  const active = hover || value;

  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl leading-none"
        >
          <AiFillStar
            className={s <= active ? "text-yellow-400" : "text-gray-300"}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-slate-600">{value} sao</span>
    </div>
  );
};

/* =========================
   Lấy user hiện tại từ localStorage
========================= */
const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/* =========================
   Page
========================= */
export default function CourseDetail() {
  const { id } = useParams(); // course id từ /course/:id
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [added, setAdded] = useState(false);

  // 👉 trạng thái ẩn/bỏ bớt đánh giá
  const [showAllReviews, setShowAllReviews] = useState(false);

  const currentUser = getCurrentUser();
  const token = localStorage.getItem("token");

  // ===== API =====
  const fetchCourse = async () => {
    try {
      setErr("");
      const res = await axios.get(`${API_URL}/courses/${id}`); // ✅ dùng API_URL
      setCourse(res.data);
    } catch (e) {
      console.error(e);
      setErr("Không tải được thông tin khoá học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchCourse();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading)
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 animate-pulse">
        <div className="h-9 w-2/3 bg-orange-200/40 rounded mb-4" />
        <div className="h-5 w-56 bg-orange-200/30 rounded mb-6" />
        <div className="aspect-video bg-orange-200/30 rounded-2xl mb-6" />
      </div>
    );

  if (!course)
    return (
      <p className="text-center mt-16 text-red-500">
        {err || "Không tìm thấy khoá học."}
      </p>
    );

  // ===== derive =====
  const title = course?.title || "Khoá học";
  const teacherName =
    course?.teacher?.name ||
    (typeof course?.teacher === "string" ? course.teacher : "Chưa có");
  const ratingValue = Number(course?.rating ?? 0);
  const reviews = course.reviews || [];
  const reviewsCount = reviews.length;
  const students = Number(course?.students ?? 0);

  // 👉 Số review hiển thị khi thu gọn (giống Shopee/TikTok: 2 cái đầu)
  const MAX_COLLAPSED = 2;
  const visibleReviews = showAllReviews
    ? reviews
    : reviews.slice(0, MAX_COLLAPSED);

  const demoUrlRaw =
    course?.demoVideo || course?.videoDemo || course?.introVideo || "";
  const embedUrl = toYouTubeEmbed(demoUrlRaw);

  const rawPrice = typeof course?.price === "number" ? course.price : 0;
  const finalPrice = Math.max(0, Math.round(rawPrice * (1 - discount)));
  const priceText = finalPrice
    ? `${finalPrice.toLocaleString("vi-VN")} ₫${
        discount ? ` (−${discount * 100}%)` : ""
      }`
    : "Miễn phí";

  // backend có thể trả isEnrolled = true nếu user đã mua
  const isEnrolled = !!course?.isEnrolled;

  // ===== Actions =====
  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (code === "SALE10") setDiscount(0.1);
    else if (code === "NEW20") setDiscount(0.2);
    else setDiscount(0);
  };

  const addToCart = () => {
    try {
      const item = {
        _id: course._id,
        title: course.title,
        thumb: course.image,
        price: course.price || 0,
        qty: 1,
      };

      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const idx = cart.findIndex((x) => x._id === item._id);
      if (idx >= 0) cart[idx].qty += 1;
      else cart.push(item);

      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));

      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch (err2) {
      console.error("Add to cart failed:", err2);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!token || !currentUser) {
      alert("Bạn cần đăng nhập để đánh giá khoá học.");
      navigate("/login");
      return;
    }

    if (!newReview.comment.trim()) {
      alert("Vui lòng nhập nội dung nhận xét.");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${API_URL}/courses/${id}/reviews`,
        {
          // ❗ Không gửi userName, backend tự lấy từ req.user
          rating: newReview.rating,
          comment: newReview.comment,
        },
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
          withCredentials: true,
        }
      );

      await fetchCourse();
      setNewReview({ rating: 5, comment: "" });
    } catch (error) {
      console.error("Send review error:", error);
      alert("Không thể gửi đánh giá. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50/40 text-slate-800">
      {/* ===== Header / Hero ===== */}
      <div className="bg-gradient-to-b from-orange-50 to-white border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <nav className="text-sm text-slate-500">
            <Link to="/" className="hover:text-orange-600">
              Trang chủ
            </Link>{" "}
            /{" "}
            <Link to="/courses" className="hover:text-orange-600">
              Khoá học
            </Link>{" "}
            / <span className="text-slate-700">{title}</span>
          </nav>

          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">
            {title}
          </h1>

          <p className="mt-2 text-slate-600 max-w-3xl">
            {course.shortDescription ||
              "Trong khoá học này, bạn sẽ học những kiến thức quan trọng để nâng cao kỹ năng của mình."}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Stars value={ratingValue} />
            <span className="text-slate-600">({reviewsCount} đánh giá)</span>
            <span className="text-slate-600">
              👥 {students.toLocaleString("vi-VN")} học viên
            </span>
            <span className="text-slate-500">
              Giảng viên:{" "}
              <button
                className="text-orange-600 hover:text-orange-500 underline underline-offset-2"
                onClick={() =>
                  course.teacher?._id &&
                  navigate(`/teacher/${course.teacher._id}`)
                }
              >
                {teacherName}
              </button>
            </span>
          </div>
        </div>
      </div>

      {/* ===== Main Content ===== */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ==== LEFT: video + mô tả ==== */}
        <section className="lg:col-span-2 space-y-6">
          {/* Video demo hoặc ảnh cover */}
          {embedUrl ? (
            <div className="aspect-video rounded-2xl overflow-hidden bg-white shadow-lg border border-orange-100">
              <iframe
                src={embedUrl}
                title="Video demo"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          ) : (
            <img
              src={
                course.image || "https://placehold.co/800x450?text=Course+Image"
              }
              alt={title}
              className="w-full max-h-[420px] object-cover rounded-2xl border border-orange-100 shadow-soft"
            />
          )}

          {/* Phần highlight: bạn sẽ học được gì */}
          <div className="rounded-2xl bg-white border border-orange-100 p-6">
            <h2 className="text-xl font-semibold text-orange-600 mb-2">
              Bạn sẽ học được gì?
            </h2>
            {course.whatYouWillLearn && Array.isArray(course.whatYouWillLearn) ? (
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                {course.whatYouWillLearn.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-700">
                Khoá học giúp bạn xây dựng nền tảng vững chắc, hiểu sâu bản chất
                và có khả năng áp dụng vào dự án thực tế.
              </p>
            )}
          </div>

          {/* Mô tả chi tiết */}
          <div className="rounded-2xl bg-white border border-orange-100 p-6">
            <h2 className="text-xl font-semibold text-orange-600 mb-2">
              Mô tả khoá học
            </h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {course.description || "Chưa có mô tả cho khoá học này."}
            </p>
          </div>

          {/* Đối tượng phù hợp */}
          <div className="rounded-2xl bg-white border border-orange-100 p-6">
            <h2 className="text-xl font-semibold text-orange-600 mb-2">
              Khoá học dành cho ai?
            </h2>
            {course.targetAudience && Array.isArray(course.targetAudience) ? (
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                {course.targetAudience.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-700">
                Phù hợp cho người mới bắt đầu hoặc đã có kiến thức cơ bản muốn
                hệ thống lại và nâng cao kỹ năng.
              </p>
            )}
          </div>

          {/* Đánh giá */}
          <div className="rounded-2xl bg-white border border-orange-100 p-6">
            <h2 className="text-xl font-semibold text-orange-600 mb-3">
              Đánh giá khoá học
            </h2>
            <div className="flex items-center mb-4">
              <Stars value={ratingValue} size={22} />
              <span className="ml-3 text-slate-700 font-medium">
                {ratingValue.toFixed(1)}/5 ({reviewsCount} đánh giá)
              </span>
            </div>

            {/* Danh sách đánh giá */}
            <div className="space-y-3">
              {reviewsCount ? (
                <>
                  {visibleReviews.map((r, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-orange-50/40 border border-orange-100"
                    >
                      <p className="font-semibold text-slate-800 flex items-center gap-2">
                        <span>{r.userName || r.user?.name || "Người dùng"}</span>
                        <span className="inline-flex">
                          {Array.from({ length: r.rating }).map((_, j) => (
                            <AiFillStar key={j} className="text-yellow-400" />
                          ))}
                        </span>
                      </p>
                      <p className="text-slate-700">{r.comment}</p>
                      {r.createdAt && (
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      )}
                    </div>
                  ))}

                  {reviewsCount > MAX_COLLAPSED && (
                    <button
                      type="button"
                      onClick={() => setShowAllReviews((v) => !v)}
                      className="mt-2 text-sm font-medium text-orange-600 hover:text-orange-500"
                    >
                      {showAllReviews
                        ? "Thu gọn bớt đánh giá"
                        : `Xem thêm ${reviewsCount - MAX_COLLAPSED} đánh giá`}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-slate-500 italic">Chưa có đánh giá nào.</p>
              )}
            </div>

            {/* form gửi đánh giá */}
            <form
              onSubmit={handleReviewSubmit}
              className="mt-5 space-y-3 border-t border-orange-100 pt-4"
            >
              {/* Tên user: tự lấy từ tài khoản */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tên của bạn
                  </label>
                  <input
                    className="w-full border border-orange-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 cursor-not-allowed"
                    value={currentUser?.name || ""}
                    placeholder="Bạn cần đăng nhập để đánh giá"
                    disabled
                  />
                </div>

                {/* Chọn số sao */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Đánh giá
                  </label>
                  <StarSelector
                    value={newReview.rating}
                    onChange={(val) =>
                      setNewReview((prev) => ({ ...prev, rating: val }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nhận xét của bạn
                </label>
                <textarea
                  rows="3"
                  className="w-full border border-orange-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-300 outline-none"
                  placeholder="Nhận xét của bạn…"
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                  }
                />
              </div>

              <button
                disabled={submitting}
                className={`w-full rounded-xl bg-orange-500 text-white py-2 font-semibold hover:bg-orange-600 active:bg-orange-700 transition ${
                  submitting ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {submitting ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </form>
          </div>
        </section>

        {/* ==== RIGHT: card mua khóa ==== */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 rounded-2xl bg-white shadow-md border border-orange-100 p-4">
            <img
              src={
                course.image || "https://placehold.co/560x315?text=Thumbnail"
              }
              alt={title}
              className="w-full h-40 object-cover rounded-xl border border-orange-100"
            />

            <div className="mt-4">
              <div className="text-2xl font-bold text-orange-600">
                {priceText}
              </div>

              {/* Nếu đã mua thì cho nút Vào học */}
              {isEnrolled && (
                <button
                  onClick={() => navigate(`/learning/${course._id}`)}
                  className="mt-3 w-full rounded-xl bg-primary text-white py-2.5 font-semibold hover:bg-accent transition"
                >
                  Vào học ngay
                </button>
              )}

              <button
                onClick={() => navigate(`/registercourse/${course._id}`)}
                className="mt-3 w-full rounded-xl bg-orange-500 text-white py-2.5 font-semibold hover:bg-orange-600 active:bg-orange-700 transition"
              >
                {isEnrolled ? "Mua thêm cho người khác" : "Mua ngay"}
              </button>

              <button
                onClick={addToCart}
                className="mt-2 w-full rounded-xl border border-orange-200 text-orange-600 py-2.5 font-semibold hover:bg-orange-50 transition"
              >
                {added ? "✔ Đã thêm vào giỏ" : "Thêm vào giỏ hàng"}
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Áp dụng mã giảm giá
              </p>
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="SALE10 hoặc NEW20"
                  className="flex-1 rounded-xl border border-orange-200 px-3 py-2 focus:ring-2 focus:ring-orange-300 outline-none"
                />
                <button
                  onClick={applyCoupon}
                  className="rounded-xl bg-orange-500 text-white px-3 py-2 font-medium hover:bg-orange-600 active:bg-orange-700 transition"
                >
                  Áp dụng
                </button>
              </div>
              <ul className="mt-4 text-sm text-slate-600 list-disc pl-5 space-y-1">
                <li>Video bài giảng chất lượng cao</li>
                <li>Truy cập trọn đời trên mọi thiết bị</li>
                <li>Bài tập thực hành & tài liệu kèm theo</li>
                <li>Hỗ trợ hỏi đáp với giảng viên</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
