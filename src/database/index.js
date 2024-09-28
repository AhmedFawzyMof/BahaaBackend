const sqlite3 = require("sqlite3").verbose();

let db = new sqlite3.Database("./src/database/bahaa.db3", (err) => {
  if (err) {
    return console.error(err.message);
  }
});

module.exports = db;
