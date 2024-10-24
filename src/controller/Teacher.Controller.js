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

    const token = jwt.sign({ teacher: teacher }, process.env.JWT_SECRET);
    res.status(200).json({ token });
  } catch (error) {
    console.log(error);
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
    console.log(error);
    res.status(500).json({ message: error });
  }
};

module.exports = {
  Login,
  GetDashboard,
};
