const express = require("express");
const router = express.Router();
const {
  GetTests,
  GetAllTests,
  GetTestQuestions,
  SubmitTest,
  Results,
} = require("../controller/Tests.Controller");
const { validateToken } = require("../middleware/Validate.Middleware");

router.get("/", validateToken, GetTests);
router.get("/results", validateToken, Results);
router.get("/all/:limit", validateToken, GetAllTests);
router.get("/:id", validateToken, GetTestQuestions);
router.post("/:id", validateToken, SubmitTest);

module.exports = router;
