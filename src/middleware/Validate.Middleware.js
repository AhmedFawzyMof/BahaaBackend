const jwt = require("jsonwebtoken");

const validateToken = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.params.student = { ...decoded.student };
    next();
  });
};

const validateTeacher = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (decoded.teacher.type !== "teacher") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.params.teacher = { ...decoded.teacher };
    next();
  });
};

module.exports = { validateToken, validateTeacher };
