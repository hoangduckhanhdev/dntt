const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const router = express.Router();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, 
});
router.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      console.log(" NO_FILE in upload");
      return res.status(400).json({ ok: false, error: "NO_FILE" });
    }
    console.log(" Upload file:", {
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
    const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
      "base64"
    )}`;
    const up = await cloudinary.uploader.upload(b64, {
      folder: "learnfeed",
      resource_type: "auto", 
    });
    console.log(" Cloudinary uploaded:", up.secure_url);
    return res.json({
      ok: true,
      url: up.secure_url,
      publicId: up.public_id,
      type: up.resource_type, 
    });
  } catch (e) {
    console.error("UPLOAD_ERR", e);
    res.status(500).json({
      ok: false,
      error: "UPLOAD_FAILED",
      message: e.message,
    });
  }
});
module.exports = router;
