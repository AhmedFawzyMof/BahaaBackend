const db = require("../database");

class Homeworks {
  constructor(homeworks) {
    this.homeworks = homeworks;
  }

  static getHomeworks(studentId, grade) {
    return new Promise((resolve, reject) => {
      const currentDate = new Date();
      const formattedDateTime = currentDate
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      db.all(
        "SELECT Homework.id, Homework.homework_name, Homework.cover, (SELECT UserAnswerHomework.id FROM UserAnswerHomework WHERE UserAnswerHomework.user_id = ?) AS HA FROM Homework LEFT JOIN UserAnswerHomework ON UserAnswerHomework.homework_id = Homework.id WHERE Homework.created_at <= ? AND Homework.grade_id = ? AND UserAnswerHomework.id IS NOT HA OR HA IS NULL LIMIT 4",
        [studentId, formattedDateTime, grade],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }
}

module.exports = Homeworks;
