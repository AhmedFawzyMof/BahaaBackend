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
      const formattedDateTime = egyptTime
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      console.log(studentId, formattedDateTime, grade);
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

  static getAllHomeworks(studentId, grade, limit) {
    return new Promise((resolve, reject) => {
      const currentDate = new Date();
      const egyptTime = new Date(
        currentDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" })
      );
      const formattedDateTime = egyptTime
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const Limit = parseInt(limit);
      const Offset = Limit - 30;

      db.all(
        "SELECT Homework.id, Homework.homework_name, Homework.cover, Homework.created_at, (SELECT homework_id FROM UserHomeworkResult WHERE UserHomeworkResult.user_id = ?) AS FH FROM Homework LEFT JOIN UserHomeworkResult ON UserHomeworkResult.homework_id = Homework.id WHERE Homework.id IS NOT FH AND Homework.created_at <= ? AND Homework.grade_id = ? LIMIT ? OFFSET ?",
        [studentId, formattedDateTime, grade, Limit, Offset],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
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
            answer.studentId,
            answer.questionId,
            answer.text_answer,
            answer.choice_answer,
            answer.isRight,
            answer.homeworkId,
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

    const sql = `INSERT INTO UserHomeworkResult(homework_id, user_id, result, public) VALUES(?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [homework.id, homework.studentId, homework.result, 0],
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

  Delete() {
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

    fs.unlink(homeworkData.cover, (err) => {
      if (err) {
        console.error("Error deleting the file:", err);
      } else {
        console.log("File deleted successfully");
      }
    });
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
}

module.exports = Homeworks;
