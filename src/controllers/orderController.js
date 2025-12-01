const Order = require("../models/Order");
const Course = require("../models/Course");

/* =====================================================
   🧾 TẠO ĐƠN HÀNG (Client gửi khi bấm "Thanh toán")
===================================================== */
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, note, couponCode, paymentMethod } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Thiếu thông tin đơn hàng" });
    }

    // ✅ Lấy thông tin chi tiết từng khóa học từ DB để đảm bảo đúng giá
    const courseDocs = await Course.find({
      _id: { $in: items.map((i) => i.course) },
    });

    const orderItems = items.map((i) => {
      const c = courseDocs.find(
        (x) => x._id.toString() === i.course.toString()
      );
      return {
        course: i.course,
        price: c ? c.price : i.price || 0,
        qty: i.qty || 1,
        courseTitle: c?.title,
        courseImage: c?.image,
      };
    });

    // ✅ Tạo đơn hàng mới
    const order = new Order({
      user: userId,
      items: orderItems,
      note,
      couponCode,
      paymentMethod: paymentMethod || "manual",
    });

    order.recalculateTotal();
    await order.save();

    res.status(201).json({ message: "Đã tạo đơn hàng thành công", order });
  } catch (err) {
    console.error("❌ Lỗi tạo đơn hàng:", err);
    res.status(500).json({ message: "Lỗi khi tạo đơn hàng", error: err.message });
  }
};

/* =====================================================
   📦 LẤY DANH SÁCH ĐƠN HÀNG CỦA NGƯỜI DÙNG
===================================================== */
exports.getMyOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("items.course", "title image price")
      .lean();

    res.json(orders);
  } catch (err) {
    console.error("❌ Lỗi lấy đơn hàng người dùng:", err);
    res.status(500).json({ message: "Không thể lấy đơn hàng" });
  }
};

/* =====================================================
   🧮 ADMIN — LẤY TẤT CẢ ĐƠN HÀNG
===================================================== */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(orders);
  } catch (err) {
    console.error("❌ Lỗi lấy tất cả đơn hàng:", err);
    res.status(500).json({ message: "Không thể lấy danh sách đơn hàng" });
  }
};

/* =====================================================
   💰 CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (ADMIN)
===================================================== */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    order.status = status;
    await order.save();

    // Nếu đơn hàng được thanh toán => cập nhật số học viên trong các khóa học
    if (status === "paid") {
      for (const item of order.items) {
        await Course.findByIdAndUpdate(item.course, {
          $inc: { students: item.qty || 1 },
        });
      }
    }

    res.json({ message: "Cập nhật trạng thái thành công", order });
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái đơn:", err);
    res.status(500).json({ message: "Không thể cập nhật đơn hàng", error: err.message });
  }
};
