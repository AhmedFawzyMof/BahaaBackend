const express = require("express");
const router = express.Router();
const { validateTeacher } = require("../middleware/Validate.Middleware");
const { Login, GetDashboard } = require("../controller/Teacher.Controller");

router.post("/login", Login);
router.get("/dashboard", validateTeacher, GetDashboard);

module.exports = router;
