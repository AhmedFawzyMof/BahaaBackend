const express = require("express");
const router = express.Router();
const { validateToken } = require("../middleware/Validate.Middleware");
const { Login, GetAchivments } = require("../controller/Students.Controller");

router.post("/login", Login);
router.get("/achivments", validateToken, GetAchivments);

module.exports = router;
