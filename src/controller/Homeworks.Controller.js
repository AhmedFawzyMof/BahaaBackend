const Homeworks = require("../models/Homeworks.Model");

const GetHomeworks = async (req, res) => {
  try {
    const { id, grade_id } = req.params.student;
    const homeworks = await Homeworks.getHomeworks(id, grade_id);
    res.json(homeworks);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "حدث خطأ ما في الحصول على الواجبات" });
  }
};

module.exports = {
  GetHomeworks,
};
