const db = require("../database");
const fs = require("fs");

class QuestionsModel {
  constructor(questions) {
    this.questions = questions;
  }
  async getQuestionsBank() {
    const questions = this.questions;
    const questionsAnswered = new Promise((resolve, reject) => {
      db.all(
        "SELECT question_id FROM UserAnswerQuestionsBank WHERE UserAnswerQuestionsBank.user_id = ? GROUP BY UserAnswerQuestionsBank.question_id",
        [questions.user_id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
    const ids = [];
    for (const question of await questionsAnswered) {
      ids.push(question.question_id);
    }

    return new Promise((resolve, reject) => {
      db.all(
        `SELECT Questions.id, Questions.question, Questions.grade_id, Questions.image, QuestionChoices.the_choice, (SELECT count(QuestionTextAnswers.id) From QuestionTextAnswers WHERE QuestionTextAnswers.question_id = Questions.id ) as number_of_inputs From Questions LEFT JOIN QuestionChoices ON QuestionChoices.question_id = Questions.id LEFT JOIN QuestionTextAnswers ON QuestionTextAnswers.question_id = Questions.id  WHERE Questions.grade_id = ? AND Questions.bank = 1 AND Questions.id NOT IN (${ids.join(
          ","
        )})`,
        [questions.grade_id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  async getQuestionsBankForAnswer() {
    const { questions } = this;
    return new Promise((resolve, reject) => {
      const sql = `SELECT Questions.id, Questions.question, Questions.image, QuestionChoices.the_choice, QuestionChoices.is_right_choice, QuestionTextAnswers.the_answer From Questions LEFT JOIN QuestionChoices ON QuestionChoices.question_id = Questions.id LEFT JOIN QuestionTextAnswers ON QuestionTextAnswers.question_id = Questions.id WHERE Questions.id IN (${questions.answersIds.join(
        ","
      )})`;
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }

  async addAnswers() {
    const { questions } = this;
    const sql = `INSERT INTO UserAnswerQuestionsBank(user_id, question_id, text_answer, choice_answer, is_right) VALUES(?, ?, ?, ?, ?)`;
    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [
          questions.studentId,
          questions.questionId,
          questions.text_answer,
          questions.choice_answer,
          questions.isRight,
        ],
        (_, err) => {
          if (err) reject(err);
          return resolve();
        }
      );
    });
  }

  getAllQuestions() {
    const { questions } = this;

    const sql = `SELECT Questions.id, Questions.question, Questions.grade_id, Questions.term_id, Questions.bank, Questions.image, QuestionChoices.the_choice, QuestionChoices.is_right_choice, QuestionTextAnswers.the_answer From Questions LEFT JOIN QuestionChoices ON QuestionChoices.question_id = Questions.id LEFT JOIN QuestionTextAnswers ON QuestionTextAnswers.question_id = Questions.id  WHERE Questions.grade_id = ? ${
      questions.term_id !== 0
        ? `AND Questions.term_id = ${questions.term_id}`
        : ""
    }`;

    return new Promise((resolve, reject) => {
      db.all(sql, [questions.grade_id], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }

  addQuestion() {
    const { questions } = this;
    new Promise((resolve, reject) => {
      const sql = `INSERT INTO Questions(question, grade_id, term_id, bank, image) VALUES(?, ?, ?, ?, ?)`;
      const bank = questions.bank ? 1 : 0;
      db.run(
        sql,
        [
          questions.question,
          questions.grade_id,
          questions.term_id,
          bank,
          questions.image,
        ],
        (_, err) => {
          if (err) reject(err);
          return resolve();
        }
      );
    });
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM Questions ORDER BY id DESC LIMIT 1`;
      db.get(sql, [], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  addQuestionAnswers() {
    const { questions } = this;
    const sql = `INSERT INTO ${
      questions.question_type === "multiple-choice"
        ? "QuestionChoices"
        : "QuestionTextAnswers"
    }(question_id, ${
      questions.question_type === "multiple-choice"
        ? "the_choice, is_right_choice"
        : "the_answer"
    }) VALUES(${
      questions.question_type === "multiple-choice" ? "?, ?, ?" : "?, ?"
    })`;

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(sql);
      if (questions.question_type === "multiple-choice") {
        for (const answer of questions.choices) {
          const correct = answer.is_correct ? 1 : 0;
          stmt.run(
            [questions.question_id, answer.choice, correct],
            (_, err) => {
              if (err) {
                stmt.finalize();
                return reject(err);
              }
            }
          );
        }
        stmt.finalize();
        resolve();
      }
      if (questions.question_type === "input") {
        for (const answer of questions.inputs) {
          stmt.run([questions.question_id, answer.input], (_, err) => {
            if (err) {
              stmt.finalize();
              return reject(err);
            }
          });
        }
        stmt.finalize();
        resolve();
      }
    });
  }
  async Delete() {
    const { questions } = this;
    const question = await new Promise((resolve, reject) => {
      const sql = `SELECT image FROM Questions WHERE id = ?`;
      db.get(sql, [questions.id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (question.image !== "") {
      fs.unlink("./" + question.image, (err) => {
        if (err) {
          console.error("Error deleting the file:", err);
        } else {
          console.log("File deleted successfully");
        }
      });
    }
    const sql = "DELETE FROM Questions WHERE id = ?";
    return new Promise((resolve, reject) => {
      db.run(sql, [questions.id], (err) => {
        if (err) reject(err);
        resolve("success");
      });
    });
  }
  updateQuestion() {
    const { questions } = this;
    const sql = `UPDATE Questions SET question = ?, grade_id = ?, term_id = ?, bank = ? WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(
        sql,
        [
          questions.question,
          questions.grade_id,
          questions.term_id,
          questions.bank ? 1 : 0,
          questions.id,
        ],
        (_, err) => {
          if (err) reject(err);
          return resolve();
        }
      );
    });
  }

  updateQuestionAnswers() {
    const { questions } = this;

    new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM ${
          questions.question_type === "multiple-choice"
            ? "QuestionChoices"
            : "QuestionTextAnswers"
        } WHERE question_id = ?`,
        [questions.question_id],
        (err) => {
          if (err) reject(err);
          return resolve();
        }
      );
    });

    const sql = `INSERT INTO ${
      questions.question_type === "multiple-choice"
        ? "QuestionChoices"
        : "QuestionTextAnswers"
    }(question_id, ${
      questions.question_type === "multiple-choice"
        ? "the_choice, is_right_choice"
        : "the_answer"
    }) VALUES(${
      questions.question_type === "multiple-choice" ? "?, ?, ?" : "?, ?"
    })`;

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(sql);
      if (questions.question_type === "multiple-choice") {
        for (const answer of questions.choices) {
          const correct = answer.is_correct ? 1 : 0;
          stmt.run(
            [questions.question_id, answer.choice, correct],
            (_, err) => {
              if (err) {
                stmt.finalize();
                return reject(err);
              }
            }
          );
        }
        stmt.finalize();
        return resolve();
      }
      if (questions.question_type === "input") {
        for (const answer of questions.inputs) {
          stmt.run([questions.question_id, answer.input], (_, err) => {
            if (err) {
              stmt.finalize();
              return reject(err);
            }
          });
        }
        stmt.finalize();
        return resolve();
      }
    });
  }
  getTypeData() {
    const { questions } = this;
    const sql = `SELECT id, ${
      (questions.type === "homework" && "homework_name") ||
      (questions.type === "test" && "test_name") ||
      (questions.type === "publictest" && "test_name") ||
      (questions.type === "videos" && "video_name")
    } FROM ${
      questions.type === "homework"
        ? "Homework"
        : questions.type === "test"
        ? "Tests"
        : questions.type === "publictest"
        ? "PublicTests"
        : "Videos"
    } WHERE grade_id = ? AND term_id = ?`;
    return new Promise((resolve, reject) => {
      db.all(sql, [questions.stage, questions.term], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }
  connectQuestions() {
    const { questions } = this;
    const sql = `INSERT INTO ConnectQuestions(question_id, ${
      (questions.type === "homework" && "homework_id") ||
      (questions.type === "test" && "test_id") ||
      (questions.type === "publictest" && "publictest_id") ||
      (questions.type === "videos" && "video_id")
    }) VALUES(?, ?)`;
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(sql);
      for (const question of questions.questions) {
        stmt.run([question.id, questions.data_id], (_, err) => {
          if (err) {
            stmt.finalize();
            return reject(err);
          }
        });
      }
      stmt.finalize();
      return resolve();
    });
  }

  async Ditails() {
    const { questions } = this;

    const data = await new Promise((resolve, reject) => {
      db.all(
        "SELECT User.id, User.username FROM UserAnswerQuestionsBank INNER JOIN User ON UserAnswerQuestionsBank.user_id = User.id INNER JOIN Questions ON UserAnswerQuestionsBank.question_id = Questions.id WHERE Questions.grade_id = ? AND Questions.term_id = ? GROUP BY User.id",
        [questions.stage, questions.term],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    return data;
  }

  async Answers() {
    const { questions } = this;

    const studentAnswers = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, question_id, text_answer, choice_answer, is_right FROM UserAnswerQuestionsBank WHERE user_id = ?`,
        [questions.student_id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    const questionIds = studentAnswers.map((answer) => answer.question_id);

    const answers = await new Promise((resolve, reject) => {
      db.all(
        `SELECT Questions.id, Questions.question, Questions.grade_id, Questions.term_id, Questions.bank, Questions.image, QuestionChoices.the_choice, QuestionChoices.is_right_choice, QuestionTextAnswers.the_answer From Questions LEFT JOIN QuestionChoices ON QuestionChoices.question_id = Questions.id LEFT JOIN QuestionTextAnswers ON QuestionTextAnswers.question_id = Questions.id  WHERE Questions.id IN (${questionIds.join(
          ","
        )}) AND grade_id = ? AND term_id = ?`,
        [questions.stage, questions.term],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    return { answers, studentAnswers };
  }
}

module.exports = QuestionsModel;
