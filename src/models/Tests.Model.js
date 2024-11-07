const db = require("../database");

class Tests {
  constructor(tests) {
    this.tests = tests;
  }

  static async getTests(studentId, grade) {
    return new Promise((resolve, reject) => {
      const currentDate = new Date();
      const egyptTime = new Date(
        currentDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" })
      );
      const formattedDateTime = egyptTime
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      db.all(
        `SELECT Tests.id, Tests.test_name, Tests.cover, Tests.created_at, Tests.expire_date, (SELECT test_id FROM UserTestResult WHERE UserTestResult.user_id = ?) AS FT FROM Tests LEFT JOIN UserTestResult ON UserTestResult.test_id = Tests.id WHERE Tests.id IS NOT FT AND Tests.created_at <= ? AND Tests.expire_date >= ? LIMIT 4`,
        [studentId, formattedDateTime, formattedDateTime],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  static async getAllTests(studentId, grade, limit) {
    return new Promise((resolve, reject) => {
      const currentDate = new Date();
      const formattedDateTime = currentDate
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const Limit = parseInt(limit);
      const Offset = Limit - 30;

      db.all(
        `SELECT Tests.id, Tests.test_name, Tests.cover, Tests.created_at, Tests.expire_date, (SELECT test_id FROM UserTestResult WHERE UserTestResult.user_id = ?) AS FT FROM Tests LEFT JOIN UserTestResult ON UserTestResult.test_id = Tests.id WHERE Tests.id IS NOT FT AND Tests.id AND Tests.created_at <= ? AND Tests.expire_date >= ? AND Tests.grade_id = ? LIMIT ? OFFSET ?`,
        [studentId, formattedDateTime, formattedDateTime, grade, Limit, Offset],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  async getTestQuestions() {
    const test = this.tests;
    const currentDate = new Date();
    const egyptTime = new Date(
      currentDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" })
    );
    const formattedDateTime = egyptTime
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const solved_test = new Promise((resolve, reject) => {
      db.all(
        "SELECT UserTestResult.id FROM UserTestResult LEFT JOIN Tests ON Tests.id = UserTestResult.test_id WHERE UserTestResult.test_id = ? AND UserTestResult.user_id = ? OR Tests.expire_date >= ? ",
        [test.test_id, test.student_id, formattedDateTime],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
    const solved = await solved_test;
    if (solved.length > 0) {
      return new Error("Test is already solved");
    }
    const questions_ids = new Promise((resolve, reject) => {
      db.all(
        "SELECT question_id FROM ConnectQuestions WHERE test_id = ?",
        [test.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
    const ids = [];
    for (const question of await questions_ids) {
      ids.push(question.question_id);
    }

    return new Promise((resolve, reject) => {
      const sql = `SELECT Questions.id, Questions.question, Questions.image, QuestionChoices.the_choice, (SELECT count(QuestionTextAnswers.id) From QuestionTextAnswers WHERE QuestionTextAnswers.question_id = Questions.id ) as number_of_inputs From Questions LEFT JOIN QuestionChoices ON QuestionChoices.question_id = Questions.id LEFT JOIN QuestionTextAnswers ON QuestionTextAnswers.question_id = Questions.id WHERE Questions.id IN (${ids.join(
        ","
      )})`;
      db.all(sql, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }
  async getTestQuestionsForAnswer() {
    const test = this.tests;

    const currentDate = new Date();
    const egyptTime = new Date(
      currentDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" })
    );
    const formattedDateTime = egyptTime
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const solved_test = new Promise((resolve, reject) => {
      db.all(
        "SELECT UserTestResult.id FROM UserTestResult LEFT JOIN Tests ON Tests.id = UserTestResult.test_id WHERE UserTestResult.test_id = ? AND UserTestResult.user_id = ? OR Tests.expire_date >= ? ",
        [test.test_id, test.student_id, formattedDateTime],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
    const solved = await solved_test;
    if (solved.length > 0) {
      return new Error("Test is already solved");
    }

    const questions_ids = new Promise((resolve, reject) => {
      db.all(
        "SELECT question_id FROM ConnectQuestions WHERE test_id = ?",
        [test.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
    const ids = [];
    for (const question of await questions_ids) {
      ids.push(question.question_id);
    }

    return new Promise((resolve, reject) => {
      const sql = `SELECT Questions.id, Questions.question, Questions.image, QuestionChoices.the_choice, QuestionChoices.is_right_choice, QuestionTextAnswers.the_answer From Questions LEFT JOIN QuestionChoices ON QuestionChoices.question_id = Questions.id LEFT JOIN QuestionTextAnswers ON QuestionTextAnswers.question_id = Questions.id WHERE Questions.id IN (${ids.join(
        ","
      )})`;
      db.all(sql, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }
  addAnswers() {
    const test = this.tests;
    const sql = `INSERT INTO UserAnswerTest(user_id, question_id, text_answer, choice_answer, is_right, test_id) VALUES(?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [
          test.studentId,
          test.questionId,
          test.text_answer,
          test.choice_answer,
          test.isRight,
          test.id,
        ],
        (_, err) => {
          if (err) reject(err);
          return resolve();
        }
      );
    });
  }
  addResult() {
    const test = this.tests;

    const sql = `INSERT INTO UserTestResult(test_id, user_id, result, public) VALUES(?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      db.run(sql, [test.id, test.studentId, test.result, 0], (res, err) => {
        if (err) reject(err);
        return resolve(res);
      });
    });
  }

  getAll() {
    const test = this.tests;
    let offset = test.limit - 30;

    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM Tests WHERE grade_id = ? LIMIT ? OFFSET ?",
        [test.stage, 30, offset],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  async Create() {
    const test = this.tests;

    test.cover = "/test/" + test.cover;

    const sql = `INSERT INTO Tests(test_name, cover, grade_id, term_id, created_at, expire_date) VALUES(?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [
          test.test_name,
          test.cover,
          test.grade_id,
          test.term_id,
          test.created_at,
          test.expire_date,
        ],
        (res, err) => {
          if (err) reject(err);
          return resolve(res);
        }
      );
    });
  }

  Delete() {
    const test = this.tests;
    const testData = new Promise((resolve, reject) => {
      db.get("SELECT cover FROM Tests WHERE id = ?", [test.id], (err, row) => {
        if (err) reject(err);
        return resolve(row);
      });
    });

    fs.unlink(testData.cover, (err) => {
      if (err) {
        console.error("Error deleting the file:", err);
      } else {
        console.log("File deleted successfully");
      }
    });
    const sql = `DELETE FROM Tests WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.run(sql, [test.id], (err, res) => {
        if (err) reject(err);
        return resolve(res);
      });
    });
  }

  Update() {
    const test = this.tests;

    const sql = `UPDATE Tests SET test_name = ?, grade_id = ?, term_id = ?, created_at = ? WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [test.test_name, test.grade_id, test.term_id, test.created_at, test.id],
        (err, res) => {
          if (err) reject(err);
          return resolve(res);
        }
      );
    });
  }
}

module.exports = Tests;
