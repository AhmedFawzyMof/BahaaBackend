const express = require("express");
const router = express.Router();
const { GetHomeworks } = require("../controller/Homeworks.Controller");
const { validateToken } = require("../middleware/Validate.Middleware");

router.get("/", validateToken, GetHomeworks);

module.exports = router;
