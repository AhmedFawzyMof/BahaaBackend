const jwt = require("jsonwebtoken");
const Gemini = require("../middleware/AI.Middleware");
const crypto = require("crypto");
const Student = require("../models/Students.Model");
const Grades = require("../models/Grade.Model");
const PlansModel = require("../models/Plans.Model");

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

    // eslint-disable-next-line no-undef
    const token = jwt.sign({ student: student }, process.env.JWT_SECRET);
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
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
    console.error(error);
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
    console.error(error);
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

const StudentData = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      homeworkChartData,
      testsChartData,
      UserSolvedHomework,
      UserSolvedTests,
    } = await new Student({
      id,
    }).GetData();

    res.status(200).json({
      homeworkChartData,
      testsChartData,
      UserSolvedHomework,
      UserSolvedTests,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const GenratePlan = async (req, res) => {
  try {
    const { subject, student_id } = req.body;

    const grade = await new Grades({ student_id }).GetGradeName();
    const responseFromAi = await Gemini.GenrateAiPlan(
      subject,
      grade.grade_name
    );

    res.json({
      response: responseFromAi,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const SavePlan = async (req, res) => {
  try {
    const { plan, student_id, subject } = req.body;
    await new PlansModel({
      plan,
      user: student_id,
      subject,
    }).savePlan();
    res.json({
      response: "done",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const ShowStudentPlans = async (req, res) => {
  try {
    const { id } = req.params;
    const plans = await new PlansModel({ student_id: id }).getPlans();
    res.json({
      plans,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const DeletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    await new PlansModel({ id }).Delete();
    res.status(201).json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error in deleting a plan" });
  }
};

const GetPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await new PlansModel({ id }).getPlan();
    res.json({
      plan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const EditPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;
    await new PlansModel({ id, plan }).Edit();
    res.status(201).json({ message: "Plan edited successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error in editing a plan" });
  }
};

module.exports = {
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
};
