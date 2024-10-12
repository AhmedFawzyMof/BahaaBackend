const db = require("../database");

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
}

module.exports = QuestionsModel;
