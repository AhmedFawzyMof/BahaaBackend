const express = require("express");
const router = express.Router();
const { validateTeacher } = require("../middleware/Validate.Middleware");
const {
  Login,
  GetDashboard,
  ChangeMarks,
  PublishResult,
} = require("../controller/Teacher.Controller");

router.post("/login", Login);
router.get("/dashboard", validateTeacher, GetDashboard);
router.put("/marking/:type/:id", validateTeacher, ChangeMarks);
router.post("/publish", validateTeacher, PublishResult);

module.exports = router;
