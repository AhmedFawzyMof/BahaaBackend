const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Student = require("../models/Students.Model");
const Grades = require("../models/Grade.Model");

const Login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const student = await new Student({
      username,
      password: hashedPassword,
    }).Login();

    const token = jwt.sign({ student: student }, process.env.JWT_SECRET);
    res.status(200).json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

const GetAchivments = async (req, res) => {
  try {
    const { id } = req.params.student;
    const achivments = await new Student({ id }).getAchivments();
    achivments.map((achivment) => {
      for (const key in achivment) {
        if (achivment[key] === null) {
          delete achivment[key];
        }
      }
      return achivment;
    });
    res.status(200).json(achivments);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

const GetAllStudents = async (req, res) => {
  try {
    const { stage, limit } = req.params;
    const students = await new Student({
      stage: parseInt(stage),
      limit: parseInt(limit),
    }).getAllStudents();
    const grades = await new Grades({}).GetAll();
    res.status(200).json({ students, grades });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

const CreateStudent = async (req, res) => {
  try {
    const student = req.body;

    const message = await new Student({
      username: student.username,
      password: student.password,
      grade: student.grade,
      parent_phone: student.parent_phone,
      isBlocked: student.isBlocked,
      BlockReason: student.BlockReason,
    }).Create();

    res.json({
      message: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const UpdateStudent = async (req, res) => {
  try {
    const student = req.body;
    const message = await new Student({
      username: student.username,
      password: student.password,
      grade: student.grade,
      parent_phone: student.parent_phone,
      isBlocked: student.isBlocked,
      BlockReason: student.BlockReason,
      id: student.id,
    }).Update();
    res.json({
      message: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const DeleteStudent = async (req, res) => {
  try {
    const id = req.params.id;
    const message = await new Student({
      id,
    }).Delete();

    res.json({
      message: message,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err });
  }
};

module.exports = {
  Login,
  GetAchivments,
  GetAllStudents,
  CreateStudent,
  UpdateStudent,
  DeleteStudent,
};
