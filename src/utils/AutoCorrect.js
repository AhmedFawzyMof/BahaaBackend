const fs = require("fs");

const AutoCorrect = (answers, questions) => {
  let totalScore = 0;
  let achivedScore = 0;
  const newAnswers = [];
  console.log(answers, questions);
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    totalScore++;
    if (question.type === "input") {
      totalScore += question.the_answer.length;
    }
    const answer = answers.find((q) => q.questionId === question.id);
    if (question.type === "choice") {
      if (!answer) {
        newAnswers.push({
          type: "choice",
          answer: { the_answer: "", isRight: 0 },
        });
      }
      const answerChoice = answer.answer;
      const questionCorrectAnswer = question.the_choice;

      if (answerChoice === questionCorrectAnswer) {
        newAnswers.push({
          ...answer,
          answer: { the_answer: answer.answer, isRight: 1 },
        });
        achivedScore++;
      } else {
        newAnswers.push({
          ...answer,
          answer: { the_answer: answer.answer, isRight: 0 },
        });
      }
    }

    if (question.type === "input") {
      if (!answer) {
        newAnswers.push({
          type: "input",
          answer: [{ the_answer: "", isRight: 0 }],
        });
      }
      const answerInputs = answer.answer;
      const questionCorrectAnswer = question.the_answer;

      questionCorrectAnswer.forEach((qca) => {
        const findAnAnswer = answerInputs.find((an) => an === qca);

        if (findAnAnswer) {
          const correct = newAnswers.find((an) => {
            return an.questionId === question.id;
          });

          if (!correct) {
            newAnswers.push({
              ...answer,
              answer: [{ the_answer: qca, isRight: 1 }],
            });
          } else {
            correct.answer.push({ the_answer: qca, isRight: 1 });
          }

          achivedScore++;
        } else {
          const correct = newAnswers.find((an) => {
            return an.questionId === question.id;
          });

          if (!correct) {
            newAnswers.push({
              ...answer,
              answer: [{ the_answer: answer.answer, isRight: 0 }],
            });
          } else {
            correct.answer.push({ the_answer: answer.answer, isRight: 0 });
          }
        }
      });
    }
  }

  const percentageValue = `${((achivedScore / totalScore) * 100).toFixed(2)}%`;

  return { result: percentageValue, newAnswers };
};

module.exports = {
  AutoCorrect,
};
