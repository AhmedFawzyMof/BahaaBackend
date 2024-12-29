const db = require("../database");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

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
    const QueryKeys = {
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
      type: {
        homework: "Homework",
        test: "Tests",
        video: "Videos",
      },
      column: {
        homework: "homework_name",
        test: "test_name",
        video: "title",
      },
    };
    // SELECT VideoResult.video_id, VideoResult.result, VideoResult.user_id, Videos.title FROM VideoResult INNER JOIN Videos ON VideoResult.video_id = Videos.id WHERE VideoResult.user_id = ? AND VideoResult.public = 1
    const sql = `SELECT ${QueryKeys.table[student.type]}.${
      QueryKeys.id[student.type]
    }, ${QueryKeys.table[student.type]}.result, ${
      QueryKeys.table[student.type]
    }.user_id, ${QueryKeys.type[student.type]}.${
      QueryKeys.column[student.type]
    } FROM ${QueryKeys.table[student.type]} INNER JOIN ${
      QueryKeys.type[student.type]
    } ON ${QueryKeys.table[student.type]}.${QueryKeys.id[student.type]} = ${
      QueryKeys.type[student.type]
    }.id WHERE ${QueryKeys.table[student.type]}.user_id = ? AND ${
      QueryKeys.table[student.type]
    }.public = 1`;

    return new Promise((resolve, reject) => {
      db.all(sql, [student.id], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
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
        }
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
        }
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
  async GetData() {
    const { student } = this;

    const homeworkChartData = await new Promise((resolve, reject) => {
      db.all(
        "SELECT strftime('%Y-%m', UserHomeworkResult.submitted_at) AS month, AVG(CAST(REPLACE(UserHomeworkResult.result, '%', '') AS REAL)) AS result FROM UserHomeworkResult INNER JOIN Homework ON UserHomeworkResult.homework_id = Homework.id WHERE UserHomeworkResult.submitted_at >= date('now', '-5 months') AND UserHomeworkResult.user_id = ? GROUP BY strftime('%Y-%m', UserHomeworkResult.submitted_at) ORDER BY month",
        [student.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    const testsChartData = await new Promise((resolve, reject) => {
      db.all(
        "SELECT strftime('%Y-%m', UserTestResult.submitted_at) AS month, AVG(CAST(REPLACE(UserTestResult.result, '%', '') AS REAL)) AS result FROM UserTestResult INNER JOIN Tests ON UserTestResult.test_id = Tests.id WHERE UserTestResult.submitted_at >= date('now', '-5 months') AND UserTestResult.user_id = ? GROUP BY strftime('%Y-%m', UserTestResult.submitted_at) ORDER BY month",
        [student.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    const UserSolvedHomework = await new Promise((resolve, reject) => {
      db.all(
        "SELECT Homework.id, UserHomeworkResult.public, Homework.homework_name, UserHomeworkResult.result FROM UserHomeworkResult INNER JOIN Homework ON UserHomeworkResult.homework_id = Homework.id WHERE UserHomeworkResult.user_id = ?",
        [student.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    const UserSolvedTests = await new Promise((resolve, reject) => {
      db.all(
        "SELECT Tests.id, UserTestResult.public, Tests.test_name, UserTestResult.result FROM UserTestResult INNER JOIN Tests ON UserTestResult.test_id = Tests.id WHERE UserTestResult.user_id = ?",
        [student.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    return {
      homeworkChartData,
      testsChartData,
      UserSolvedHomework,
      UserSolvedTests,
    };
  }
}

module.exports = StudentsModel;
