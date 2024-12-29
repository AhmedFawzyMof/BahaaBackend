const db = require("../database");

class TermModel {
  constructor(term) {
    this.term = term;
  }

  SetTerm() {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE CurrentTerm SET term_id = ?";
      db.run(sql, [this.term], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
  GetCurrentTerm() {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM CurrentTerm";
      db.get(sql, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }
}

module.exports = TermModel;
