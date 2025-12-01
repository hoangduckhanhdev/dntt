const express = require("express");
const router = express.Router();
const {
  getContact,
  createContact,
  updateContact,
  deleteContact
} = require("../controllers/contactController");

router.get("/", getContact);
router.post("/", createContact);
router.put("/", updateContact);
router.delete("/", deleteContact);

module.exports = router;
