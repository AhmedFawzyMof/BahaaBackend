const express = require("express");
const router = express.Router();
const {
  GetTestQuestions,
  SubmitTest,
  Results,
  GetAllTestsTeacher,
  CreateTest,
  UpdateTest,
  DeleteTest,
  CheckUser,
  TestDitails,
  TestAnswers,
} = require("../controller/PublicTests.Controller");
const {
  validateToken,
  validateTeacher,
} = require("../middleware/Validate.Middleware");

router.post("/create", validateTeacher, CreateTest);
router.post("/updates", validateTeacher, UpdateTest);
router.get("/results", validateToken, Results);
router.get("/:id", validateToken, GetTestQuestions);
router.get("/techer/:type/:id", validateTeacher, TestDitails);
router.get(
  "/techer/answers/:test_id/:student_id",
  validateTeacher,
  TestAnswers
);
router.post("/:id/user", CheckUser);
router.post("/:id", SubmitTest);
router.delete("/:id", validateTeacher, DeleteTest);
router.get("/getall/:stage/:limit", validateTeacher, GetAllTestsTeacher);

module.exports = router;
