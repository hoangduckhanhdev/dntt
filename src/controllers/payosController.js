// controllers/payosController.js
const PayOSModule = require("@payos/node");
const nodemailer = require("nodemailer");
const Course = require("../models/Course");
const Order = require("../models/Order");
const RegisterCourse = require("../models/registerCourse");
require("dotenv").config();

/* --------- Khởi tạo PayOS (tương thích nhiều kiểu export) --------- */
const PayOSCtor =
  (PayOSModule && PayOSModule.default) ||
  (PayOSModule && PayOSModule.PayOS) ||
  PayOSModule;

if (typeof PayOSCtor !== "function") {
  throw new Error("Không tìm thấy constructor PayOS trong @payos/node.");
}

const payOS = new PayOSCtor(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

/* ---------------- Helpers & Email ---------------- */
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const shorten = (s, max = 25) => String(s || "").trim().slice(0, max);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

/* ⭐ NEW: cộng học viên khi đơn đã thanh toán (idempotent) */
async function markOrderPaidAndCount(orderCode) {
  const code = Number(orderCode);
  const order = await Order.findOne({ transactionId: code });
  if (!order) return { ok: false, reason: "NO_ORDER" };

  // nếu chưa là 'paid' thì set lại
  if (order.status !== "paid") {
    order.status = "paid";
  }

  // đã cộng trước đó rồi thì bỏ qua
  if (order.counted) {
    await order.save(); // đảm bảo status='paid' được lưu
    return { ok: true, skipped: true };
  }

  // cộng students theo từng course
  const ops = (order.items || []).map((it) => ({
    updateOne: {
      filter: { _id: it.course },
      update: { $inc: { students: Math.max(1, Number(it.qty || 1)) } },
    },
  }));
  if (ops.length) await Course.bulkWrite(ops);

  order.counted = true;
  await order.save();
  return { ok: true };
}

async function sendEmailsAfterPaid(reg, orderCode) {
  const courseTitle = reg?.courseId?.title || "khóa học của bạn";
  const formattedAmount = (reg.amount || 0).toLocaleString("vi-VN");

  // email học viên
  try {
    await transporter.sendMail({
      from: `"Khoá học Online" <${process.env.EMAIL_USER}>`,
      to: reg.email,
      subject: "Xác nhận thanh toán thành công 🎉",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #16a34a;">🎉 Thanh toán thành công!</h2>
          <p>Xin chào <b>${reg.studentName}</b>,</p>
          <p>Bạn đã thanh toán thành công khóa học <b>${courseTitle}</b>.</p>
          <p>Số tiền: <b>${formattedAmount} VND</b></p>
          <p>Mã đơn hàng: <b>${orderCode}</b></p>
          <br />
          <a href="${FRONTEND_URL}/profile"
             style="display:inline-block;background:#16a34a;color:#fff;
                    padding:10px 18px;text-decoration:none;border-radius:8px;">
            Xem thông tin khóa học
          </a>
        </div>
      `,
    });
  } catch (e) {
    console.error("❌ Gửi email cho học viên thất bại:", e.message);
  }

  // email admin
  try {
    await transporter.sendMail({
      from: `"Hệ thống Khoá học" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `💰 Có học viên mới thanh toán khóa học "${courseTitle}"`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h3>📢 Học viên mới đã thanh toán</h3>
          <p><b>Họ tên:</b> ${reg.studentName}</p>
          <p><b>Email:</b> ${reg.email}</p>
          <p><b>SĐT:</b> ${reg.phone}</p>
          <p><b>Khóa học:</b> ${courseTitle}</p>
          <p><b>Số tiền:</b> ${formattedAmount} VND</p>
          <p><b>Mã đơn hàng:</b> ${orderCode}</p>
          <p>🕐 ${new Date().toLocaleString("vi-VN")}</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("❌ Gửi email cho admin thất bại:", e.message);
  }
}

/* ------------- Tạo link PayOS (đa biến thể + fallback HTTP) --------- */
async function createPayOSLink(payload) {
  if (typeof payOS?.createPaymentLink === "function")
    return payOS.createPaymentLink(payload);
  if (typeof payOS?.createPaymentRequest === "function")
    return payOS.createPaymentRequest(payload);

  if (typeof payOS?.paymentLinks?.createPaymentLink === "function")
    return payOS.paymentLinks.createPaymentLink(payload);
  if (typeof payOS?.paymentLinks?.create === "function")
    return payOS.paymentLinks.create(payload);

  if (typeof payOS?.paymentRequests?.createPaymentRequest === "function")
    return payOS.paymentRequests.createPaymentRequest(payload);
  if (typeof payOS?.paymentRequests?.createPaymentLink === "function")
    return payOS.paymentRequests.createPaymentLink(payload);
  if (typeof payOS?.paymentRequests?.create === "function")
    return payOS.paymentRequests.create(payload);

  if (typeof payOS?.paymentRequests?.invoices?.create === "function")
    return payOS.paymentRequests.invoices.create(payload);

  const client =
    payOS?.paymentRequests?._client ||
    payOS?.paymentLinks?._client ||
    payOS?._client;

  if (client?.post) {
    const resp = await client.post("/v2/payment-requests", payload);
    return resp?.data ? resp.data : resp;
  }
  throw new Error("Không tìm thấy API tạo link thanh toán trong SDK PayOS.");
}

/* ----------- Lấy Payment Request từ PayOS để kiểm tra trạng thái ------- */
async function getPaymentRequest(orderCode) {
  if (typeof payOS?.paymentRequests?.getPaymentRequest === "function") {
    return await payOS.paymentRequests.getPaymentRequest(orderCode);
  }
  const client = payOS?.paymentRequests?._client || payOS?._client;
  if (!client?.get) throw new Error("SDK PayOS không có GET client");
  const resp = await client.get(`/v2/payment-requests/${orderCode}`);
  return resp?.data ? resp.data : resp;
}

/* ================== API: tạo đơn thanh toán (BẮT BUỘC LOGIN) ================== */
exports.registerCourse = async (req, res) => {
  try {
    // 🔐 BẮT BUỘC ĐĂNG NHẬP
    if (!req.user?._id) {
      return res
        .status(401)
        .json({ message: "Vui lòng đăng nhập để thanh toán." });
    }
    const userId = req.user._id;

    const { studentName, email, phone, courseId, teacherId, note } = req.body;
    if (!studentName || !email || !phone || !courseId) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
    }

    const course = await Course.findById(courseId)
      .select("title price image thumbnail")
      .lean();
    if (!course)
      return res.status(404).json({ message: "Không tìm thấy khóa học." });

    const intAmount = Math.round(Number(course.price || 0));
    if (!Number.isInteger(intAmount) || intAmount < 1000) {
      return res
        .status(400)
        .json({ message: "Giá khóa học không hợp lệ." });
    }

    // 💾 Lưu đăng ký khoá học (PENDING) – NHỚ GHI userId
    const registration = await RegisterCourse.create({
      userId, // 🔥 BỔ SUNG DÒNG NÀY
      studentName,
      email,
      phone,
      courseId,
      teacherId,
      note,
      amount: intAmount,
      paymentStatus: "pending",
      paymentMethod: "PayOS",
    });

    const orderCode = Date.now();
    const description = shorten(`KH:${course.title || courseId}`, 25);

    const payload = {
      orderCode,
      amount: intAmount,
      description,
      returnUrl: `${FRONTEND_URL}/register-success?orderCode=${orderCode}`,
      cancelUrl: `${FRONTEND_URL}/register-fail?orderCode=${orderCode}&cancel=true`,
    };

    const paymentLink = await createPayOSLink(payload);
    const checkoutUrl =
      paymentLink?.checkoutUrl || paymentLink?.data?.checkoutUrl;
    const qrCode = paymentLink?.qrCode || paymentLink?.data?.qrCode;

    registration.transactionId = orderCode;
    await registration.save();

    await Order.findOneAndUpdate(
      { transactionId: orderCode },
      {
        $setOnInsert: {
          user: userId,
          items: [
            {
              course: courseId,
              price: intAmount,
              qty: 1,
              courseTitle: course.title,
              courseImage: course.thumbnail || course.image || "",
            },
          ],
          total: intAmount,
          paymentMethod: "PayOS",
          customerName: studentName,
          email,
          phone,
        },
        status: "pending",
      },
      { upsert: true, new: true, runValidators: false }
    );

    return res.status(201).json({
      success: true,
      message: "Tạo thanh toán PayOS thành công.",
      data: { registration, checkoutUrl, qrCode },
    });
  } catch (err) {
    console.error(
      "❌ /api/payments/create error:",
      err?.response?.data || err
    );
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Không thể tạo thanh toán.";
    return res.status(500).json({ message: msg });
  }
};

/* ================== API: webhook PayOS ================== */
exports.handlePayOSWebhook = async (req, res) => {
  try {
    console.log("📩 Webhook nhận:", JSON.stringify(req.body));

    let verified = false;
    try {
      verified = payOS.verifyPaymentWebhookData(req.body);
    } catch (e) {
      console.warn("⚠️ verifyPaymentWebhookData lỗi:", e?.message);
    }

    if (!verified) return res.status(200).send("IGNORED_INVALID_SIGNATURE");

    const { orderCode, status } = req.body.data || {};
    if (!orderCode) return res.status(200).send("NO_ORDER_CODE");

    if (status === "PAID") {
      const reg = await RegisterCourse.findOne({
        transactionId: Number(orderCode),
      }).populate("courseId");
      if (!reg) return res.status(200).send("NO_REGISTRATION_FOUND");

      if (reg.paymentStatus !== "paid") {
        reg.paymentStatus = "paid";
        await reg.save();

        await Order.updateOne(
          { transactionId: Number(orderCode) },
          { $set: { status: "paid" } }
        );

        // ⭐ NEW: cộng học viên & đánh dấu counted
        try {
          await markOrderPaidAndCount(orderCode);
        } catch (e) {
          console.error("❌ markOrderPaidAndCount(webhook) lỗi:", e);
        }

        console.log(`✅ Thanh toán thành công cho đơn ${orderCode}`);
        await sendEmailsAfterPaid(reg, orderCode);
      }
    }
    return res.status(200).send("OK");
  } catch (err) {
    console.error(
      "❌ Lỗi webhook:",
      err?.response?.data || err?.message || err
    );
    return res.status(200).send("ERROR_HANDLED");
  }
};

/* ================== API: confirm-return (không cần webhook) ================== */
exports.confirmReturn = async (req, res) => {
  try {
    const orderCode = Number(req.query.orderCode);
    if (!orderCode)
      return res.status(400).json({ message: "Thiếu orderCode" });

    // 1) hỏi PayOS trạng thái thật
    const pr = await getPaymentRequest(orderCode);
    const payosStatus = pr?.status || pr?.data?.status;

    // 2) cập nhật DB nếu cần
    const reg = await RegisterCourse.findOne({
      transactionId: orderCode,
    }).populate("courseId");
    if (!reg)
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn đăng ký." });

    if (payosStatus === "PAID" && reg.paymentStatus !== "paid") {
      reg.paymentStatus = "paid";
      await reg.save();

      await Order.updateOne(
        { transactionId: orderCode },
        { $set: { status: "paid" } }
      );

      // ⭐ NEW: cộng học viên & đánh dấu counted
      try {
        await markOrderPaidAndCount(orderCode);
      } catch (e) {
        console.error("❌ markOrderPaidAndCount(confirmReturn) lỗi:", e);
      }

      await sendEmailsAfterPaid(reg, orderCode);
    }

    return res.json({
      success: true,
      status: reg.paymentStatus,
      payosStatus,
    });
  } catch (err) {
    console.error(
      "confirmReturn error:",
      err?.response?.data || err.message || err
    );
    return res
      .status(500)
      .json({ message: "Không xác nhận được trạng thái thanh toán." });
  }
};

/* ================== API: check-status ================== */
exports.checkPaymentStatus = async (req, res) => {
  try {
    const orderCode = Number(req.query.orderCode);
    const reg = await RegisterCourse.findOne({ transactionId: orderCode });
    if (!reg)
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn đăng ký." });
    return res.json({ success: true, status: reg.paymentStatus });
  } catch (err) {
    console.error("❌ checkPaymentStatus:", err?.message);
    return res
      .status(500)
      .json({ message: "Lỗi khi kiểm tra trạng thái thanh toán." });
  }
};

exports.createMultiPayment = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res
        .status(401)
        .json({ message: "Vui lòng đăng nhập để thanh toán." });
    }
    const userId = req.user._id;

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length)
      return res
        .status(400)
        .json({ message: "Danh sách khoá học trống." });

    const courseIds = items.map((x) => x.courseId);
    const courses = await Course.find({ _id: { $in: courseIds } })
      .select("_id title price image thumbnail")
      .lean();

    const courseMap = new Map(courses.map((c) => [String(c._id), c]));
    const orderItems = [];
    let total = 0;

    for (const it of items) {
      const c = courseMap.get(String(it.courseId));
      if (!c) continue;
      const price = Math.round(Number(c.price || 0));
      const qty = Math.max(1, Number(it.qty || 1));
      total += price * qty;
      orderItems.push({
        course: c._id,
        price,
        qty,
        courseTitle: c.title,
        courseImage: c.thumbnail || c.image || "",
      });
    }

    if (!orderItems.length)
      return res
        .status(400)
        .json({ message: "Không có khoá học hợp lệ." });
    if (!Number.isInteger(total) || total < 1000)
      return res
        .status(400)
        .json({ message: "Tổng tiền không hợp lệ." });

    const orderCode = Date.now();
    const description = "Thanh toán nhiều khoá học";

    const payload = {
      orderCode,
      amount: total,
      description,
      returnUrl: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/register-success?orderCode=${orderCode}`,
      cancelUrl: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/register-fail?orderCode=${orderCode}&cancel=true`,
    };

    const paymentLink = await createPayOSLink(payload);
    const checkoutUrl =
      paymentLink?.checkoutUrl || paymentLink?.data?.checkoutUrl;
    const qrCode = paymentLink?.qrCode || paymentLink?.data?.qrCode;

    await Order.findOneAndUpdate(
      { transactionId: orderCode },
      {
        $setOnInsert: {
          user: userId,
          items: orderItems,
          total,
          paymentMethod: "PayOS",
        },
        status: "pending",
      },
      { upsert: true, new: true, runValidators: false }
    );

    return res.status(201).json({
      success: true,
      message: "Tạo thanh toán nhiều khoá học thành công.",
      data: {
        checkoutUrl,
        qrCode,
        itemCount: orderItems.length,
        total,
        orderCode,
      },
    });
  } catch (err) {
    console.error(
      "❌ /api/payments/create-multi error:",
      err?.response?.data || err
    );
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Không thể tạo thanh toán.";
    return res.status(500).json({ message: msg });
  }
};
