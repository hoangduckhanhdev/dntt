const express = require("express");
const router = express.Router();
const { globalSearch } = require("../../controllers/admin/adminSearchController");

router.get("/", globalSearch);

module.exports = router;
