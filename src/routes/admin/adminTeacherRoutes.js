const express = require("express");
const router = express.Router();
const uploadCloud = require("../../middlewares/uploadCloud");
const {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require("../../controllers/admin/adminTeacherController");

router.get("/", getTeachers);
router.post("/", uploadCloud.single("image"), createTeacher);
router.put("/:id", uploadCloud.single("image"), updateTeacher);
router.delete("/:id", deleteTeacher);

module.exports = router;
