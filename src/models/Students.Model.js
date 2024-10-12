const db = require("../database");
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
}

module.exports = StudentsModel;
