const express = require("express");
const router = express.Router();
const { validateToken } = require("../middleware/Validate.Middleware");
const {
  GetQuestionsBank,
  SubmitAnswers,
} = require("../controller/Questions.Controller");

router.get("/bank", validateToken, GetQuestionsBank);
router.post("/", validateToken, SubmitAnswers);

module.exports = router;
