const db = require("../database");

class TeacherModel {
  constructor(teacher) {
    this.teacher = teacher;
  }

  async Login() {
    const { teacher } = this;
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT username FROM Teacher WHERE username = ? AND password = ?",
        [teacher.username, teacher.password],
        (err, row) => {
          if (err) reject(err);
          if (row == undefined) reject("اسم المستخدم أو كلمة المرور غير صالحة");
          resolve(row);
        }
      );
    });
  }

  async StudentsNumber() {
    return new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) AS num_users FROM User;", [], (err, row) => {
        if (err) reject(err);
        if (row == undefined) reject("اسم المستخدم أو كلمة المرور غير صالحة");
        resolve(row);
      });
    });
  }

  async GetAverageResult() {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT AVG(result) AS average_result FROM UserTestResult WHERE test_id = (SELECT MAX(test_id) FROM UserTestResult)",
        [],
        (err, row) => {
          if (err) reject(err);
          if (row == undefined) reject("اسم المستخدم أو كلمة المرور غير صالحة");
          resolve(row);
        }
      );
    });
  }

  async GetPassRate() {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) AS number_of_pass, (SELECT COUNT(*) FROM UserTestResult WHERE test_id = (SELECT MAX(test_id) FROM UserTestResult)) AS total_students FROM UserTestResult WHERE test_id = (SELECT MAX(test_id) FROM UserTestResult) AND result >= 60;",
        [],
        (err, row) => {
          if (err) reject(err);
          if (row == undefined) reject("اسم المستخدم أو كلمة المرور غير صالحة");
          resolve(row);
        }
      );
    });
  }

  async AboveAverageStudents() {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(DISTINCT user_id) AS above_average FROM UserTestResult WHERE test_id = (SELECT MAX(test_id) FROM UserTestResult) AND result > 75",
        [],
        (err, row) => {
          if (err) reject(err);
          if (row == undefined) reject("اسم المستخدم أو كلمة المرور غير صالحة");
          resolve(row);
        }
      );
    });
  }

  async GetOutStandingStudents() {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT User.username, User.id, Grade.grade_name, AVG(UserTestResult.result) AS Aresult FROM UserTestResult INNER JOIN User ON UserTestResult.user_id = User.id INNER JOIN Grade ON User.grade_id = Grade.id WHERE result >= 75 GROUP BY UserTestResult.user_id ORDER BY Aresult DESC LIMIT 30",
        [],
        (err, row) => {
          if (err) reject(err);
          if (row == undefined) reject("اسم المستخدم أو كلمة المرور غير صالحة");
          resolve(row);
        }
      );
    });
  }
}

module.exports = TeacherModel;
