const db = require("../database");
class StudentsModel {
  constructor(student) {
    this.student = student;
  }
  Login() {
    const { student } = this;
    const sql = "SELECT * FROM User WHERE username = ? AND password = ?";

    return new Promise((resolve, reject) => {
      db.get(sql, [student.username, student.password], (err, row) => {
        console.log(row);
        if (err) reject(err);
        if (row == undefined) reject("اسم المستخدم أو كلمة المرور غير صالحة");
        resolve(row);
      });
    });
  }
}

module.exports = StudentsModel;
