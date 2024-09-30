const TestsModel = require("../models/Tests.Model");

const GetTests = async (req, res) => {
  try {
    const { id, grade_id } = req.params.student;
    const tests = await TestsModel.getTests(id, grade_id);
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

module.exports = {
  GetTests,
};
