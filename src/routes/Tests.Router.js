const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  GetTests,
  GetAllTests,
  GetTestQuestions,
  SubmitTest,
  Results,
  GetAllTestsTeacher,
  CreateTest,
  UpdateTest,
  DeleteTest,
} = require("../controller/Tests.Controller");
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

router.get("/", validateToken, GetTests);
router.post("/create", validateTeacher, upload.single("cover"), CreateTest);
router.post("/updates", validateTeacher, upload.single("cover"), UpdateTest);
router.get("/results", validateToken, Results);
router.get("/all/:limit", validateToken, GetAllTests);
router.get("/:id", validateToken, GetTestQuestions);
router.post("/:id", validateToken, SubmitTest);
router.delete("/:id", validateTeacher, DeleteTest);
router.get("/getall/:stage/:limit", validateTeacher, GetAllTestsTeacher);

module.exports = router;
