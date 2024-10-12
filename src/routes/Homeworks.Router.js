const express = require("express");
const router = express.Router();
const {
  GetHomeworks,
  GetAllHomeworks,
  GetHomeworkQuestions,
  SubmitHomework,
  Results,
} = require("../controller/Homeworks.Controller");
const { validateToken } = require("../middleware/Validate.Middleware");

router.get("/", validateToken, GetHomeworks);
router.get("/results", validateToken, Results);
router.get("/all/:limit", validateToken, GetAllHomeworks);
router.get("/:id", validateToken, GetHomeworkQuestions);
router.post("/:id", validateToken, SubmitHomework);

module.exports = router;
