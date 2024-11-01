const { throws } = require("assert");
const db = require("../database");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { resolve } = require("path");

class StudentsModel {
  constructor(student) {
    this.student = student;
  }
  Login() {
    const { student } = this;
    const sql = "SELECT * FROM User WHERE username = ? AND password = ?";

    return new Promise((resolve, reject) => {
      db.get(sql, [student.username, student.password], (err, row) => {
        if (err) reject(err);
        if (row == undefined) reject("اسم المستخدم أو كلمة المرور غير صالحة");
        resolve(row);
      });
    });
  }

  Results() {
    const { student } = this;
    const homeworkSql =
      "SELECT UserHomeworkResult.homework_id, UserHomeworkResult.user_id, UserHomeworkResult.result, Homework.homework_name FROM UserHomeworkResult INNER JOIN Homework ON UserHomeworkResult.homework_id = Homework.id WHERE UserHomeworkResult.user_id = ? and UserHomeworkResult.public = 1";
    const testSql =
      "SELECT UserTestResult.test_id, UserTestResult.user_id, UserTestResult.result, Tests.test_name FROM UserTestResult INNER JOIN Tests ON UserTestResult.test_id = Tests.id WHERE UserTestResult.user_id = ? and UserTestResult.public = 1";

    if (student.type === "homework") {
      return new Promise((resolve, reject) => {
        db.all(homeworkSql, [student.id], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });
    }

    if (student.type === "test") {
      return new Promise((resolve, reject) => {
        db.all(testSql, [student.id], (err, row) => {
          if (err) reject(err);
          resolve(row);
        });
      });
    }
  }
  getAchivments() {
    const { student } = this;
    const sql = `SELECT
    homework_id,
    homework_result,
    username,
    test_id,
    test_result
FROM (
    SELECT
        UserHomeworkResult.homework_id,
        UserHomeworkResult.result AS homework_result,
		User.username,
        NULL AS test_id,
        NULL AS test_result
    FROM UserHomeworkResult LEFT JOIN User ON User.id = UserHomeworkResult.user_id
    WHERE UserHomeworkResult.user_id = ? AND UserHomeworkResult.public = 1 AND UserHomeworkResult.result > "50"
    UNION ALL
    SELECT
        NULL AS homework_id,
        NULL AS homework_result,
		User.username,
        UserTestResult.test_id,
        UserTestResult.result AS test_result
    FROM UserTestResult LEFT JOIN User ON User.id = UserTestResult.user_id
    WHERE UserTestResult.user_id = ? AND UserTestResult.public = 1 AND UserTestResult.result > "50"
) AS combined_results`;

    return new Promise((resolve, reject) => {
      db.all(sql, [student.id, student.id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }
  getAllStudents() {
    const { student } = this;
    let offset = student.limit - 30;
    const sql = `SELECT * FROM User WHERE grade_id = ? LIMIT ? OFFSET ?`;
    return new Promise((resolve, reject) => {
      db.all(sql, [student.stage, student.limit, offset], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }
  Create() {
    const { student } = this;
    const hashedPassword = crypto
      .createHash("sha256")
      .update(student.password)
      .digest("hex");
    const id = uuidv4();

    const sql =
      "INSERT INTO User (id, username, password, grade_id, isBlocked, BlockReason, parent_phone) VALUES (?, ?, ?, ?, ?, ?, ?)";
    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [
          id,
          student.username,
          hashedPassword,
          student.grade,
          student.isBlocked,
          student.BlockReason,
          student.parent_phone,
        ],
        (err) => {
          if (err) reject(err);
          resolve("success");
        },
      );
    });
  }
  Update() {
    const { student } = this;
    const sql =
      "UPDATE User SET username = ?, grade_id = ?, isBlocked = ?, BlockReason = ?, parent_phone = ? WHERE id = ?";
    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [
          student.username,
          student.grade,
          student.isBlocked,
          student.BlockReason,
          student.parent_phone,
          student.id,
        ],
        (err) => {
          if (err) reject(err);
          resolve("success");
        },
      );
    });
  }
  Delete() {
    const { student } = this;
    const sql = "DELETE FROM User WHERE id = ?";
    return new Promise((resolve, reject) => {
      db.run(sql, [student.id], (err) => {
        if (err) reject(err);
        resolve("success");
      });
    });
  }
}

module.exports = StudentsModel;
