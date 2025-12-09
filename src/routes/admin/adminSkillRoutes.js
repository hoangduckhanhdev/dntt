// src/routes/admin/adminSkillRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");

// upload file Excel/CSV tạm vào thư mục /uploads
const upload = multer({ dest: "uploads/" });

const {
  getSkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  reorderSkills,
  importSkills,      // import skills từ file
  aiSuggestSkills,   // ⭐ NEW: AI gợi ý skill map
} = require("../../controllers/admin/adminSkillController");

// ========== CRUD ==========
router.get("/skills", getSkills);                // GET  /api/admin/skills
router.get("/skills/:id", getSkill);             // GET  /api/admin/skills/:id
router.post("/skills", createSkill);             // POST /api/admin/skills
router.put("/skills/:id", updateSkill);          // PUT  /api/admin/skills/:id
router.delete("/skills/:id", deleteSkill);       // DEL  /api/admin/skills/:id

// ========== Reorder ==========
router.post("/skills/reorder/list", reorderSkills); // POST /api/admin/skills/reorder/list

// ========== IMPORT SKILLS ==========
// POST /api/admin/skills/import
// Body: form-data → file, courseId
router.post(
  "/skills/import",
  upload.single("file"),   // file là field name FE gửi lên
  importSkills
);

// ========== ⭐ AI SUGGEST SKILL MAP ==========
// POST /api/admin/skills/ai-suggest
// Body: { courseId, topic, difficulty, depth, ... }
router.post("/skills/ai-suggest", aiSuggestSkills);

module.exports = router;
