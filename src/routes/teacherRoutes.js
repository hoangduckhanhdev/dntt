const express = require("express");
const router = express.Router();

const {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  myCourses,
} = require("../controllers/teacherController");

const { protect } = require("../middlewares/authMiddleware");

router.get("/my-courses", protect, myCourses);

router.get("/", getTeachers);
router.get("/:id", getTeacherById);
router.post("/", createTeacher);
router.put("/:id", updateTeacher);
router.delete("/:id", deleteTeacher);

module.exports = router;
