const express = require("express");
const { getProfile, updateProfile } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, upload.fields([{ name: "avatar" }, { name: "cover" }]), updateProfile);

module.exports = router;
