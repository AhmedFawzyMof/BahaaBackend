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
  StudentData,
  GenratePlan,
  SavePlan,
  ShowStudentPlans,
  DeletePlan,
  GetPlan,
  EditPlan,
} = require("../controller/Students.Controller");

router.post("/login", Login);
router.get("/:id", validateTeacher, StudentData);
router.get("/achivments", validateToken, GetAchivments);
router.post("/create", validateTeacher, CreateStudent);
router.post("/update", validateTeacher, UpdateStudent);
router.post("/plans/generate", validateTeacher, GenratePlan);
router.post("/plans/save", validateTeacher, SavePlan);
router.get("/all/:stage/:limit", validateTeacher, GetAllStudents);
router.get("/teacher/plans/:id", validateTeacher, ShowStudentPlans);
router.get("/teacher/plan/:id", validateTeacher, GetPlan);
router.post("/teacher/plan/:id", validateTeacher, EditPlan);
router.delete("/:id", validateTeacher, DeleteStudent);
router.delete("/teacher/plan/:id", validateTeacher, DeletePlan);

module.exports = router;
