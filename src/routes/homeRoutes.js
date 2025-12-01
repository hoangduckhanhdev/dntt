const express = require("express");
const {
  getHome,
  createHome,
  updateHome,
  deleteHome,
} = require("../controllers/homeController");

const router = express.Router();

router.get("/", getHome);
router.post("/", createHome);
router.put("/", updateHome);
router.delete("/", deleteHome);

module.exports = router;
