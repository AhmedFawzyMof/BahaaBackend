const db = require("../database");

class Tests {
  constructor(tests) {
    this.tests = tests;
  }

  static async getTests(studentId, grade) {
    return new Promise((resolve, reject) => {
      const currentDate = new Date();
      const formattedDateTime = currentDate
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      db.all(
        `SELECT Tests.id, Tests.test_name, Tests.cover, (SELECT UserAnswerTest.id FROM UserAnswerTest WHERE UserAnswerTest.user_id = ?) AS HA FROM Tests LEFT JOIN UserAnswerTest ON UserAnswerTest.test_id = Tests.id WHERE Tests.created_at <= ? AND Tests.grade_id = ? AND UserAnswerTest.id IS NOT HA OR HA IS NULL LIMIT 4`,
        [studentId, formattedDateTime, grade],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }
}

module.exports = Tests;
