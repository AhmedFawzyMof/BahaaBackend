const express = require("express");
const router = express.Router();
const { GetTests } = require("../controller/Tests.Controller");
const { validateToken } = require("../middleware/Validate.Middleware");
router.get("/", validateToken, GetTests);

module.exports = router;
