const db = require("../database/index");

class Grades {
  constructor(student) {
    this.student = student;
  }
  GetAll() {
    const sql = "SELECT * FROM Grade";
    return new Promise((resolve, reject) => {
      db.all(sql, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }
}

module.exports = Grades;
