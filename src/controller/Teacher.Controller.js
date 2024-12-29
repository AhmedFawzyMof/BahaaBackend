const TeacherModel = require("../models/Teacher.Model");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Login = async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  try {
    const teacher = await new TeacherModel({
      username,
      password: hashedPassword,
    }).Login();

    teacher.type = "teacher";

    // eslint-disable-next-line no-undef
    const token = jwt.sign({ teacher: teacher }, process.env.JWT_SECRET);
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const GetDashboard = async (req, res) => {
  try {
    const StudentsNumber = await new TeacherModel({}).StudentsNumber();
    const AverageResult = await new TeacherModel({}).GetAverageResult();
    const PassRate = await new TeacherModel({}).GetPassRate();
    const AboveAverageStudents = await new TeacherModel(
      {}
    ).AboveAverageStudents();
    const GetOutStandingStudents = await new TeacherModel(
      {}
    ).GetOutStandingStudents();
    const dashboard = {
      ...StudentsNumber,
      ...AverageResult,
      PassRate,
      ...AboveAverageStudents,
      outstandingStudents: GetOutStandingStudents,
    };

    res.status(200).json({ dashboard });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const ChangeMarks = async (req, res) => {
  try {
    const { type, id } = req.params;
    const body = req.body;

    await new TeacherModel({
      right: body.right,
      answer_id: body.answer_id,
      type,
      id,
    }).ChangeMarks();
    res.status(200).json({ message: "Marks changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const PublishResult = async (req, res) => {
  try {
    const { type, id, student_id, published } = req.body;
    await new TeacherModel({ type, id, student_id, published }).PublishResult();
    res.status(200).json({ message: "Result published successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

module.exports = {
  Login,
  GetDashboard,
  ChangeMarks,
  PublishResult,
};
