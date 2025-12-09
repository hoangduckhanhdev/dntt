const { PayOS } = require("@payos/node");
const RegisterCourse = require("../models/registerCourse");
require("dotenv").config();
const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});
exports.registerCourse = async (req, res) => {
  try {
    const { studentName, email, phone, courseId, teacherId, note, amount } = req.body;
    if (!studentName || !email || !phone || !courseId || !amount) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
    }
    const registration = await RegisterCourse.create({
      studentName,
      email,
      phone,
      courseId,
      teacherId,
      note,
      paymentStatus: "pending",
      paymentMethod: "PayOS",
    });
    const orderCode = Date.now();
    const paymentLink = await payos.paymentLinks.createPaymentLink({
      orderCode,
      amount,
      description: `Thanh toán khóa học ${courseId}`,
      returnUrl: `http://localhost:5173/register-success?orderCode=${orderCode}`,
      cancelUrl: `http://localhost:5173/register-fail`,
    });
    registration.transactionId = orderCode;
    await registration.save();
    res.status(201).json({
      success: true,
      message: "Tạo thanh toán PayOS thành công.",
      data: {
        registration,
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
      },
    });
  } catch (err) {
    console.error(" Lỗi tạo thanh toán:", err);
    res.status(500).json({ message: "Không thể tạo thanh toán." });
  }
};
exports.handlePayOSWebhook = async (req, res) => {
  try {
    const verified = payos.webhooks.verifyPaymentWebhookData(req.body);
    if (!verified) return res.status(400).send("Invalid signature");
    const { orderCode, status } = req.body.data;
    if (status === "PAID") {
      const reg = await RegisterCourse.findOne({ transactionId: orderCode });
      if (reg) {
        reg.paymentStatus = "paid";
        await reg.save();
        console.log(` Thanh toán thành công cho đơn ${orderCode}`);
      }
    }
    res.status(200).send("OK");
  } catch (err) {
    console.error("Lỗi webhook:", err);
    res.status(500).send("Webhook error");
  }
};
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderCode } = req.query;
    const reg = await RegisterCourse.findOne({ transactionId: orderCode });
    if (!reg) return res.status(404).json({ message: "Không tìm thấy đơn đăng ký." });
    res.json({ success: true, status: reg.paymentStatus });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi kiểm tra trạng thái thanh toán." });
  }
};
