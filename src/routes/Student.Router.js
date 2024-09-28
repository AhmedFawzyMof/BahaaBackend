const express = require("express");
const router = express.Router();
const { Login } = require("../controller/Students.Controller");

router.post("/login", Login);

module.exports = router;
