const QuestionsModel = require("../models/Questions.Model");
const { AutoCorrect } = require("../utils/AutoCorrect");

const GetQuestionsBank = async (req, res) => {
  try {
    const grade_id = req.params.student.grade_id;
    const student_id = req.params.student.id;
    const questionsBank = await new QuestionsModel({
      grade_id,
      user_id: student_id,
    }).getQuestionsBank();
    const questions = [];
    for (const question of questionsBank) {
      const q = questions.find((q) => q.id === question.id);
      if (q) {
        if (question.the_choice !== null) {
          q.choices.push(question.the_choice);
          q.inputs = question.number_of_inputs;
        }
      } else {
        questions.push({
          ...question,
          choices: [question.the_choice],
          inputs: question.number_of_inputs,
        });
      }
    }
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const SubmitAnswers = async (req, res) => {
  try {
    const answers = req.body;
    const { id } = req.params.student;
    const ids = answers.map((answer) => answer.questionId);
    const questionsAnswered = await new QuestionsModel({
      answersIds: ids,
    }).getQuestionsBankForAnswer();
    const questions = [];
    for (const question of questionsAnswered) {
      const q = questions.find((q) => q.id === question.id);
      if (q) {
        if (q.the_answer !== null) q.the_answer.push(question.the_answer);
      } else {
        if (question.the_answer !== null) {
          questions.push({
            ...question,
            type: "input",
            the_answer: [question.the_answer],
          });
        } else {
          if (question.is_right_choice === 1)
            questions.push({
              ...question,
              type: "choice",
              the_choice: question.the_choice,
            });
        }
      }
    }

    const { result, newAnswers } = AutoCorrect(answers, questions);

    newAnswers.forEach(async (answer) => {
      if (answer.type === "choice") {
        await new QuestionsModel({
          studentId: id,
          questionId: answer.questionId,
          text_answer: null,
          choice_answer: answer.answer.the_answer,
          isRight: answer.answer.isRight,
        }).addAnswers();
      }
      if (answer.type === "input") {
        answer.answer.forEach(async (an) => {
          await new Homeworks({
            studentId: id,
            questionId: answer.questionId,
            text_answer: an.the_answer,
            choice_answer: null,
            isRight: an.isRight,
          }).addAnswers();
        });
      }
    });

    res.json({
      message: "تم تسليم الاسئلة بنجاح",
      result: result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { GetQuestionsBank, SubmitAnswers };
