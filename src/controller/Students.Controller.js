const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Student = require("../models/Students.Model");

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

    const token = jwt.sign({ id: student.id }, process.env.JWT_SECRET);
    res.status(200).json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

module.exports = {
  Login,
};