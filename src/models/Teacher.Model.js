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
        "SELECT COUNT(*) AS number_of_pass, (SELECT COUNT(*) FROM UserTestResult WHERE test_id = (SELECT MAX(test_id) FROM UserTestResult)) AS total_students FROM UserTestResult WHERE test_id = (SELECT MAX(test_id) FROM UserTestResult) AND result >= 50;",
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

  async ChangeMarks() {
    const { teacher } = this;

    if (teacher.type === "questions_bank") {
      return new Promise((resolve, reject) => {
        db.run(
          `UPDATE UserAnswerQuestionsBank SET is_right = ? WHERE id = ?`,
          [teacher.right, teacher.answer_id],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          }
        );
      });
    }

    const tableNames = {
      homework: {
        answer: "UserAnswerHomework",
        result: "UserHomeworkResult",
        idColumn: "homework_id",
      },
      test: {
        answer: "UserAnswerTest",
        result: "UserTestResult",
        idColumn: "test_id",
      },
      video: {
        answer: "VideoAnswers",
        result: "VideoResult",
        idColumn: "video_id",
      },
    };

    const table = tableNames[teacher.type];

    new Promise((resolve, reject) => {
      db.run(
        `UPDATE ${table.answer} SET is_right = ? WHERE id = ?`,
        [teacher.right, teacher.answer_id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
    const newResults = await new Promise((resolve, reject) => {
      db.all(
        `SELECT is_right FROM ${table.answer} WHERE ${table.idColumn} = ?`,
        [teacher.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
    const calculatePercentage = (arr) => {
      const total = arr.length;
      const correct = arr.filter((answer) => answer.is_right === 1).length;
      return ((correct / total) * 100).toFixed(2);
    };

    const result = `${calculatePercentage(newResults)} %`;
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE ${table.result} SET result = ? WHERE ${table.idColumn} = ?`,
        [result, teacher.id],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  PublishResult() {
    const { teacher } = this;
    return new Promise((resolve, reject) => {
      const tableNames = {
        table: {
          homework: "UserHomeworkResult",
          test: "UserTestResult",
          video: "VideoResult",
        },
        id: {
          homework: "homework_id",
          test: "test_id",
          video: "video_id",
        },
      };
      const sql = `UPDATE ${
        tableNames.table[teacher.type]
      } SET public = ? WHERE ${
        tableNames.id[teacher.type]
      } = ? AND user_id = ?`;

      let isPublic = 0;

      if (teacher.published === 0) {
        isPublic = 1;
      }

      db.run(sql, [isPublic, teacher.id, teacher.student_id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}

module.exports = TeacherModel;
