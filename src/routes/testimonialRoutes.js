const express = require("express");
const router = express.Router();
const { getTestimonials, createTestimonial } = require("../controllers/testimonialController");

router.get("/", getTestimonials);
router.post("/", createTestimonial); // tùy, chỉ dùng nếu bạn muốn thêm bằng tay

module.exports = router;
