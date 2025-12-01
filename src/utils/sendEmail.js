require("dotenv").config(); // ✅ Đảm bảo .env được load

const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Dùng SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"HKCode Academy" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Gửi email thành công tới: ${to}`);
  } catch (err) {
    console.error("❌ Gửi email thất bại:", err);
  }
};

module.exports = sendEmail;
