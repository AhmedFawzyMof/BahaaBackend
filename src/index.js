const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
// eslint-disable-next-line no-undef
const port = process.env.PORT || 3000;
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: "*",
  })
);

const StudentRouter = require("./routes/Student.Router");
const TestsRouter = require("./routes/Tests.Router");
const HomeworksRouter = require("./routes/Homeworks.Router");
const QuestionsRouter = require("./routes/Questions.Router");
const TeacherRouter = require("./routes/Teacher.Router");
const GradesRouter = require("./routes/Grades.Router");
const PublicTestsRouter = require("./routes/PublicTests.Router");
const VideosRouter = require("./routes/Videos.Router");

app.use("/api/student", StudentRouter);
app.use("/api/tests", TestsRouter);
app.use("/api/public_tests", PublicTestsRouter);
app.use("/api/homeworks", HomeworksRouter);
app.use("/api/questions", QuestionsRouter);
app.use("/api/teacher", TeacherRouter);
app.use("/api/grades", GradesRouter);
app.use("/api/videos", VideosRouter);

app.use((req, res, next) => {
  if (req.url.includes("api")) {
    next();
  } else {
    // eslint-disable-next-line no-undef
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  }
});

app.listen(port, () => console.log(`http://localhost:${port}`));
