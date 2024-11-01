const express = require("express");
const router = express.Router();
const {
  validateToken,
  validateTeacher,
} = require("../middleware/Validate.Middleware");
const {
  Login,
  GetAchivments,
  GetAllStudents,
  CreateStudent,
  UpdateStudent,
  DeleteStudent,
} = require("../controller/Students.Controller");

router.post("/login", Login);
router.get("/achivments", validateToken, GetAchivments);
router.post("/create", validateTeacher, CreateStudent);
router.post("/update", validateTeacher, UpdateStudent);
router.get("/all/:stage/:limit", validateTeacher, GetAllStudents);
router.delete("/:id", validateTeacher, DeleteStudent);

module.exports = router;
