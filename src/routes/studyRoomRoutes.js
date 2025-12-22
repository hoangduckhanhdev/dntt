const express = require("express");
const passport = require("passport");
const router = express.Router();
const studyRoomController = require("../controllers/studyRoomController");
const auth = passport.authenticate("jwt", { session: false });
//router.get("/course/:courseId/classes", auth, studyRoomController.getCourseClassesByCourse);

router.get("/my", auth, studyRoomController.getMyRooms);
router.post("/", auth, studyRoomController.createRoom);
router.patch("/:roomId", auth, studyRoomController.updateRoom);
router.delete("/:roomId", auth, studyRoomController.deleteRoom);
router.get("/:roomId/messages", auth, studyRoomController.getRoomMessages);

module.exports = router;
