const express = require("express");
const router = express.Router();
const {
  DeleteGrade,
  GetAllGrades,
  CreateGrade,
  UpdateGrade,
} = require("../controller/Grades.Controller");

const { validateTeacher } = require("../middleware/Validate.Middleware");

router.delete("/:id", validateTeacher, DeleteGrade);
router.get("/all", validateTeacher, GetAllGrades);
router.post("/create", validateTeacher, CreateGrade);
router.post("/updates", validateTeacher, UpdateGrade);

module.exports = router;
