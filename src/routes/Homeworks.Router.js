const express = require("express");
const router = express.Router();
const {
  GetHomeworks,
  GetAllHomeworks,
  GetHomeworkQuestions,
  SubmitHomework,
  Results,
  GetAllHomeworksTeacher,
} = require("../controller/Homeworks.Controller");
const {
  validateToken,
  validateTeacher,
} = require("../middleware/Validate.Middleware");

router.get("/", validateToken, GetHomeworks);
router.get("/results", validateToken, Results);
router.get("/all/:limit", validateToken, GetAllHomeworks);
router.get("/:id", validateToken, GetHomeworkQuestions);
router.post("/:id", validateToken, SubmitHomework);
router.get("/getall/:stage/:limit", validateTeacher, GetAllHomeworksTeacher);

module.exports = router;
