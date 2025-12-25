const express = require("express");
const router = express.Router();
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getDropdowns,
  getCourseStudents,
  getStudentProgress,
  getCourseQuestions,
  answerCourseQuestion,
  getCourseClasses, 
  updateCourseCurriculum,
} = require("../../controllers/admin/adminCourseController");
const { protect, adminOrTeacher } = require("../../middlewares/authMiddleware");
const upload = require("../../middlewares/upload");
router.get("/dropdowns", protect, adminOrTeacher, getDropdowns);
router.get("/", protect, adminOrTeacher, getAllCourses);
router.get("/:id", protect, adminOrTeacher, getCourse);
router.get("/:id/classes", protect, adminOrTeacher, getCourseClasses);
router.post("/", protect, adminOrTeacher, upload.single("image"), createCourse);
router.put("/:id", protect, adminOrTeacher, upload.single("image"), updateCourse);
router.delete("/:id", protect, adminOrTeacher, deleteCourse);
router.get("/:id/students", protect, adminOrTeacher, getCourseStudents);
router.get("/:id/students/:userId/progress", protect, adminOrTeacher, getStudentProgress);
router.get("/:id/questions", protect, adminOrTeacher, getCourseQuestions);
router.post("/:id/questions/:questionId/answer",protect,adminOrTeacher,answerCourseQuestion);
router.put(
  "/:id/curriculum",
  protect,
  adminOrTeacher,
  updateCourseCurriculum
);
module.exports = router;
