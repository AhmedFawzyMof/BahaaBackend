const AutoCorrect = (answers, questions) => {
  let totalScore = 0;
  let achivedScore = 0;
  const newAnswers = [];
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
          questionId: question.id,
          type: "choice",
          answer: { the_answer: "", isRight: 0 },
        });
      } else {
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
    }

    if (question.type === "input") {
      if (!answer) {
        newAnswers.push({
          questionId: question.id,
          type: "input",
          answer: [{ the_answer: "", isRight: 0 }],
        });
      } else {
        const answerInputs = answer.answer;
        const questionCorrectAnswer = question.the_answer;

        questionCorrectAnswer.forEach((qca, qIndex) => {
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
            const studentAnswer = answerInputs.find((an, index) => {
              if (index === qIndex) {
                return an;
              }
            });

            if (!correct) {
              newAnswers.push({
                ...answer,
                answer: [{ the_answer: studentAnswer, isRight: 0 }],
              });
            } else {
              correct.answer.push({ the_answer: studentAnswer, isRight: 0 });
            }
          }
        });
      }
    }
  }
  const percentageValue = `${((achivedScore / totalScore) * 100).toFixed(2)}%`;

  return { result: percentageValue, newAnswers };
};

const formatQuestions = (questions) => {
  const newQuestions = [];
  for (const question of questions) {
    const quest = newQuestions.find((q) => q.id === question.id);
    if (!quest) {
      newQuestions.push({
        id: question.id,
        question: question.question,
        grade_id: question.grade_id,
        term_id: question.term_id,
        bank: question.bank === 1 ? true : false,
        image: question.image,
        choices:
          question.the_choice === null
            ? null
            : [
                {
                  choice: question.the_choice,
                  is_right: question.is_right_choice === 1 ? true : false,
                },
              ],
        inputs: question.the_answer === null ? null : [question.the_answer],
      });
    }
    if (quest) {
      if (quest.inputs === null) {
        quest.choices.push({
          choice: question.the_choice,
          is_right: question.is_right_choice === 1 ? true : false,
        });
      }
      if (quest.choices === null) {
        quest.inputs.push(question.the_answer);
      }
    }
  }
  return newQuestions;
};

module.exports = {
  AutoCorrect,
  formatQuestions,
};
