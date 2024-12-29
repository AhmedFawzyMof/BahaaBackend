const db = require("../database");

class Plans {
  constructor(plans) {
    this.plans = plans;
  }

  savePlan() {
    const { plans } = this;

    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO plans (plan, user, subject) VALUES (?, ?, ?)",
        [plans.plan, plans.user, plans.subject],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  getPlans() {
    const { plans } = this;

    return new Promise((resolve, reject) => {
      db.all(
        "SELECT id, user, subject FROM plans WHERE user = ?",
        [plans.student_id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  Delete() {
    const { plans } = this;

    return new Promise((resolve, reject) => {
      db.run("DELETE FROM Plans WHERE id = ?", [plans.id], (err) => {
        if (err) reject(err);
        resolve("success");
      });
    });
  }

  getPlan() {
    const { plans } = this;

    return new Promise((resolve, reject) => {
      db.get("SELECT plan FROM plans WHERE id = ?", [plans.id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  Edit() {
    const { plans } = this;

    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE plans SET plan = ? WHERE id = ?",
        [plans.plan, plans.id],
        (err) => {
          if (err) reject(err);
          resolve("success");
        }
      );
    });
  }
}

module.exports = Plans;
