const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  GetHomeworks,
  GetAllHomeworks,
  GetHomeworkQuestions,
  SubmitHomework,
  Results,
  GetAllHomeworksTeacher,
  CreateHomework,
  DeleteHomework,
  UpdateHomework,
  HomeworkDitails,
  HomeworkAnswers,
} = require("../controller/Homeworks.Controller");
const {
  validateToken,
  validateTeacher,
} = require("../middleware/Validate.Middleware");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/homework");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

router.get("/", validateToken, GetHomeworks);
router.post("/create", validateTeacher, upload.single("cover"), CreateHomework);
router.post(
  "/updates",
  validateTeacher,
  upload.single("cover"),
  UpdateHomework
);
router.get("/results", validateToken, Results);
router.get("/:id", validateToken, GetHomeworkQuestions);
router.get("/all/:limit", validateToken, GetAllHomeworks);
router.get("/techer/:type/:id", validateTeacher, HomeworkDitails);
router.get(
  "/techer/answers/:homework_id/:student_id",
  validateTeacher,
  HomeworkAnswers
);
router.post("/:id", validateToken, SubmitHomework);
router.delete("/:id", validateTeacher, DeleteHomework);
router.get("/getall/:stage/:limit", validateTeacher, GetAllHomeworksTeacher);

module.exports = router;
