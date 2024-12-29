const db = require("../database");
const fs = require("fs");

class Homeworks {
  constructor(homeworks) {
    this.homeworks = homeworks;
  }

  static getHomeworks(studentId, grade) {
    return new Promise((resolve, reject) => {
      const currentDate = new Date();
      const egyptTime = new Date(
        currentDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" })
      );
      const formattedDateTime = egyptTime.toISOString().slice(0, 19);

      db.all(
        "SELECT Homework.id, Homework.homework_name, Homework.cover, Homework.created_at, (SELECT homework_id FROM UserHomeworkResult WHERE UserHomeworkResult.user_id = ?) AS FH FROM Homework LEFT JOIN UserHomeworkResult ON UserHomeworkResult.homework_id = Homework.id WHERE Homework.id IS NOT FH AND Homework.created_at <= ? AND Homework.grade_id = ? LIMIT 4",
        [studentId, formattedDateTime, grade],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  getAllHomeworks() {
    const { student_id, grade_id, limit } = this.homeworks;
    return new Promise((resolve, reject) => {
      const currentDate = new Date();
      const egyptTime = new Date(
        currentDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" })
      );
      const formattedDateTime = egyptTime.toISOString().slice(0, 19);

      const Limit = parseInt(limit);
      const Offset = Limit - 30;
      const inputs = [student_id, formattedDateTime, grade_id, Limit, Offset];
      //   if (grade !== 9) {
      //     inputs.push(term);
      //   }
      const sql = `
      SELECT Homework.id, Homework.homework_name, Homework.cover, Homework.created_at, (SELECT homework_id FROM UserHomeworkResult WHERE UserHomeworkResult.user_id = ?) AS SOLVED_HOMEWORK
      FROM Homework LEFT JOIN UserHomeworkResult ON UserHomeworkResult.homework_id = Homework.id
      WHERE Homework.id IS NOT SOLVED_HOMEWORK AND Homework.created_at <= ? AND Homework.grade_id = ? ${
        grade_id !== 9 ? "AND Homework.term_id = ?" : ""
      } LIMIT ? OFFSET ?`;

      db.all(sql, inputs, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }

  async getHomeworkQuestions() {
    const homework = this.homeworks;

    const solved_homework = new Promise((resolve, reject) => {
      db.all(
        "SELECT id FROM UserHomeworkResult WHERE homework_id = ? AND user_id = ?",
        [homework.id, homework.student_id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
    const solved = await solved_homework;
    if (solved.length > 0) {
      return new Error("Homework is already solved");
    }
    const questions_ids = new Promise((resolve, reject) => {
      db.all(
        "SELECT question_id FROM ConnectQuestions WHERE homework_id = ?",
        [homework.id],
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

  async getHomeworkQuestionsForAnswer() {
    const homework = this.homeworks;

    const solved_homework = new Promise((resolve, reject) => {
      db.all(
        "SELECT id FROM UserHomeworkResult WHERE homework_id = ?",
        [homework.homework_id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
    const solved = await solved_homework;
    if (solved.length > 0) {
      return new Error("Homework is already solved");
    }
    const questions_ids = new Promise((resolve, reject) => {
      db.all(
        "SELECT question_id FROM ConnectQuestions WHERE homework_id = ?",
        [homework.id],
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
    const homework = this.homeworks;
    const sql = `INSERT INTO UserAnswerHomework(user_id, question_id, text_answer, choice_answer, is_right, homework_id) VALUES(?, ?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(sql);
      for (const answer of homework.answers) {
        stmt.run(
          [
            answer.student_id,
            answer.question_id,
            answer.text_answer,
            answer.choice_answer,
            answer.isRight,
            answer.homework_id,
          ],
          (err) => {
            if (err) {
              stmt.finalize();
              return reject(err);
            }
          }
        );
      }
      stmt.finalize();
      resolve();
    });
  }
  addResult() {
    const homework = this.homeworks;
    const currentDate = new Date();
    const egyptTime = new Date(
      currentDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" })
    );
    const formattedDateTime = egyptTime.toISOString().slice(0, 19);

    const sql = `INSERT INTO UserHomeworkResult(homework_id, user_id, result, public, submitted_at) VALUES(?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [
          homework.id,
          homework.studentId,
          homework.result,
          0,
          formattedDateTime,
        ],
        (res, err) => {
          if (err) reject(err);
          return resolve(res);
        }
      );
    });
  }

  getAll() {
    const homework = this.homeworks;
    let offset = homework.limit - 30;

    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM Homework WHERE grade_id = ? LIMIT ? OFFSET ?",
        [homework.stage, 30, offset],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  async Create() {
    const homework = this.homeworks;

    homework.cover = "/homework/" + homework.cover;

    const sql = `INSERT INTO Homework(homework_name, cover, grade_id, term_id, created_at) VALUES(?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [
          homework.homework_name,
          homework.cover,
          homework.grade_id,
          homework.term_id,
          homework.created_at,
        ],
        (res, err) => {
          if (err) reject(err);
          return resolve(res);
        }
      );
    });
  }

  async Delete() {
    const homework = this.homeworks;
    const homeworkData = new Promise((resolve, reject) => {
      db.get(
        "SELECT cover FROM Homework WHERE id = ?",
        [homework.id],
        (err, row) => {
          if (err) reject(err);
          return resolve(row);
        }
      );
    });

    const { cover } = await homeworkData;

    if (cover !== "") {
      fs.unlink("./public" + cover, (err) => {
        if (err) {
          console.error("Error deleting the file:", err);
        } else {
          console.log("File deleted successfully");
        }
      });
    }

    const sql = `DELETE FROM Homework WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.run(sql, [homework.id], (err, res) => {
        if (err) reject(err);
        return resolve(res);
      });
    });
  }

  Update() {
    const homework = this.homeworks;

    const sql = `UPDATE Homework SET homework_name = ?, grade_id = ?, term_id = ?, created_at = ? WHERE id = ?`;
    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [
          homework.homework_name,
          homework.grade_id,
          homework.term_id,
          homework.created_at,
          homework.id,
        ],
        (err, res) => {
          if (err) reject(err);
          return resolve(res);
        }
      );
    });
  }

  async Ditails() {
    const homework = this.homeworks;
    const passRate = await new Promise((resolve, reject) => {
      db.get(
        "SELECT COUNT(*) AS number_of_pass, (SELECT COUNT(*) FROM UserHomeworkResult WHERE homework_id = ?) AS total_students FROM UserHomeworkResult WHERE homework_id = ? AND result >= 50;",
        [homework.id, homework.id],
        (err, row) => {
          if (err) reject(err);
          if (row == undefined) reject("اسم المستخدم أو كلمة المرور غير صالحة");
          resolve(row);
        }
      );
    });

    const avgGrade = await new Promise((resolve, reject) => {
      db.get(
        "SELECT AVG(result) AS average_result FROM UserHomeworkResult WHERE homework_id = ?",
        [homework.id],
        (err, row) => {
          if (err) reject(err);
          if (row == undefined) reject("اسم المستخدم أو كلمة المرور غير صالحة");
          resolve(row);
        }
      );
    });

    let data = {};
    if (homework.type === "questions") {
      const questionsConnected = await new Promise((resolve, reject) => {
        db.all(
          "SELECT question_id FROM ConnectQuestions WHERE homework_id = ?",
          [homework.id],
          (err, rows) => {
            if (err) reject(err);
            resolve(rows);
          }
        );
      });

      const ids = [];

      for (const question of questionsConnected) {
        ids.push(question.question_id);
      }

      data = await new Promise((resolve, reject) => {
        db.all(
          `SELECT Questions.id, Questions.question, Questions.grade_id, Questions.term_id, Questions.bank, Questions.image, QuestionChoices.the_choice, QuestionChoices.is_right_choice, QuestionTextAnswers.the_answer From Questions LEFT JOIN QuestionChoices ON QuestionChoices.question_id = Questions.id LEFT JOIN QuestionTextAnswers ON QuestionTextAnswers.question_id = Questions.id  WHERE Questions.id IN (${ids.join(
            ","
          )})`,
          [],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          }
        );
      });
    } else {
      data = await new Promise((resolve, reject) => {
        db.all(
          "SELECT User.id, User.username, Grade.grade_name, UserHomeworkResult.result FROM UserHomeworkResult INNER JOIN User ON UserHomeworkResult.user_id = User.id INNER JOIN Grade ON User.grade_id = Grade.id WHERE homework_id = ?",
          [homework.id],
          (err, rows) => {
            if (err) reject(err);
            resolve(rows);
          }
        );
      });
    }

    return {
      passRate,
      avgGrade,
      data,
    };
  }

  async Answers() {
    const homework = this.homeworks;

    const homeworkQuestionsIds = await new Promise((resolve, reject) => {
      db.all(
        `SELECT Questions.id FROM ConnectQuestions INNER JOIN Questions ON ConnectQuestions.question_id = Questions.id WHERE homework_id = ?`,
        [homework.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    const studentAnswers = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, question_id, text_answer, choice_answer, is_right FROM UserAnswerHomework WHERE homework_id = ? AND user_id = ?`,
        [homework.id, homework.student_id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    const homeworkAnswers = await new Promise((resolve, reject) => {
      db.all(
        `SELECT Questions.id, Questions.question, Questions.grade_id, Questions.term_id, Questions.bank, Questions.image, QuestionChoices.the_choice, QuestionChoices.is_right_choice, QuestionTextAnswers.the_answer From Questions LEFT JOIN QuestionChoices ON QuestionChoices.question_id = Questions.id LEFT JOIN QuestionTextAnswers ON QuestionTextAnswers.question_id = Questions.id  WHERE Questions.id IN (${homeworkQuestionsIds
          .map((question) => question.id)
          .join(",")})`,
        [],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    const published = await new Promise((resolve, reject) => {
      db.get(
        "SELECT public FROM UserHomeworkResult WHERE homework_id = ? AND user_id = ?",
        [homework.id, homework.student_id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    return { homeworkAnswers, studentAnswers, published };
  }
}

module.exports = Homeworks;
