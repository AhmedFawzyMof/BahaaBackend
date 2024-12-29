const express = require("express");
const router = express.Router();

const {
  validateToken,
  validateTeacher,
} = require("../middleware/Validate.Middleware");

const {
  GetAllVideosTeacher,
  CreateVideo,
  UpdateVideo,
  DeleteVideos,
  VideoDitails,
  GetAllVideos,
  GetVideoQuestions,
  Results,
  SubmitAnswers,
  VideoAnswers,
} = require("../controller/Videos.Controller");

router.post("/create", validateTeacher, CreateVideo);
router.post("/updates", validateTeacher, UpdateVideo);
router.get("/results", validateToken, Results);
router.get("/:id", validateToken, GetVideoQuestions);
router.get("/all/:limit", validateToken, GetAllVideos);
router.get("/techer/:type/:id", validateTeacher, VideoDitails);
router.get(
  "/techer/answers/:video_id/:student_id",
  validateTeacher,
  VideoAnswers
);
router.post("/:id", validateToken, SubmitAnswers);
router.delete("/:id", validateTeacher, DeleteVideos);
router.get("/getall/:stage/:term/:limit", validateTeacher, GetAllVideosTeacher);

module.exports = router;
