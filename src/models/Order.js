// models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    // Lưu snapshot để tránh lệ thuộc giá/ảnh thay đổi sau này
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, default: 1, min: 1 },

    // Tuỳ chọn (snapshot để hiển thị nhanh trong admin/client)
    courseTitle: { type: String },
    courseImage: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    transactionId: { type: Number, index: true, unique: true, sparse: true },
    // Người mua (bắt buộc nếu yêu cầu đăng nhập để mua)
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Danh sách khoá học trong đơn
    items: {
      type: [orderItemSchema],
      validate: [(val) => Array.isArray(val) && val.length > 0, "Đơn hàng phải có ít nhất 1 sản phẩm"],
      required: true,
    },

    // Tổng tiền (server tính lại để an toàn)
    total: { type: Number, required: true, min: 0 },

    // Trạng thái đơn
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    counted: { type: Boolean, default: false },
    // Thông tin thanh toán
    paymentMethod: {
      type: String, // "cod" | "vnpay" | "momo" | "paypal" | ...
      default: "manual",
    },
    paymentRef: {
      type: String, // mã giao dịch từ cổng thanh toán (nếu có)
      index: true,
    },

    // Ghi chú/metadata (địa chỉ IP, coupon, etc.)
    note: { type: String },
    couponCode: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

/* ---------------- Helpers ---------------- */

// Tính tổng lại từ items (an toàn phía server)
orderSchema.methods.recalculateTotal = function () {
  const sum = (this.items || []).reduce((acc, it) => {
    const line = Number(it.price || 0) * Number(it.qty || 1);
    return acc + line;
  }, 0);
  this.total = Math.max(0, Math.round(sum)); // làm tròn integer (vnđ)
  return this.total;
};

// Tự tính total trước khi validate/save (nếu chưa set)
orderSchema.pre("validate", function (next) {
  if (!Array.isArray(this.items) || this.items.length === 0) {
    return next(new Error("Đơn hàng phải có ít nhất 1 sản phẩm"));
  }
  this.recalculateTotal();
  next();
});

/* ---------------- Indexes gợi ý cho thống kê ---------------- */
// Thống kê theo ngày/tháng
orderSchema.index({ createdAt: 1 });
// Thống kê theo user
orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
