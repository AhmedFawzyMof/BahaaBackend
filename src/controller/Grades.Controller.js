const GradeModel = require("../models/Grade.Model");

const GetAllGrades = async (req, res) => {
  try {
    const grades = await new GradeModel({}).GetAll();
    res.status(200).json(grades);
  } catch (error) {
    res.status(500).json({ message: "Error in getting all grades" });
  }
};

const CreateGrade = async (req, res) => {
  try {
    const { grade_name } = req.body;
    console.log(grade_name);
    await new GradeModel({ grade_name }).Create();
    res.status(201).json({ message: "Grade created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error in creating a new grade" });
  }
};

const UpdateGrade = async (req, res) => {
  try {
    const { id, grade_name } = req.body;
    console.log(id, grade_name);
    await new GradeModel({ id, grade_name }).Update();
    res.status(201).json({ message: "Grade updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error in updating a grade" });
  }
};

const DeleteGrade = async (req, res) => {
  try {
    const { id } = req.params;
    await new GradeModel({ id }).Delete();
    res.status(201).json({ message: "Grade deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error in deleting a grade" });
  }
};

module.exports = {
  GetAllGrades,
  CreateGrade,
  UpdateGrade,
  DeleteGrade,
};
