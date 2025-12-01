const express = require("express");
const passport = require("passport");
const router = express.Router();
const controller = require("../../controllers/studyRoomController");

const auth = passport.authenticate("jwt", { session: false });

router.get("/", auth, controller.adminListRooms);
router.get("/:roomId", auth, controller.adminGetRoomDetail);
router.put("/:roomId", auth, controller.adminUpdateRoom);
router.delete("/:roomId", auth, controller.adminDeleteRoom);

module.exports = router;
