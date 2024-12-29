const QuestionsModel = require("../models/Questions.Model");
const Grades = require("../models/Grade.Model");
const { AutoCorrect, formatQuestions } = require("../utils/AutoCorrect");

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
    console.error(error);
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
          await new QuestionsModel({
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

const AllQuestions = async (req, res) => {
  try {
    const { stage, term } = req.params;

    const AllQuestions = await new QuestionsModel({
      grade_id: parseInt(stage),
      term_id: parseInt(term),
    }).getAllQuestions();

    const questions = formatQuestions(AllQuestions);

    const grades = await new Grades({}).GetAll();

    res.status(200).json({ questions, grades });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const CreateQuestion = async (req, res) => {
  try {
    const body = req.body;
    let filename = null;
    const file = req.file;
    if (file) {
      filename = "img/" + file.originalname;
    }
    let choices = [];
    let inputs = [];

    if (body.question_type === "multiple-choice") {
      choices = JSON.parse(body.choices);
    }

    if (body.question_type === "input") {
      inputs = JSON.parse(body.inputs);
    }

    const newQuestion = await new QuestionsModel({
      question: body.question,
      grade_id: body.grade_id,
      term_id: body.term_id,
      image: filename,
      bank: body.bank,
    }).addQuestion();

    await new QuestionsModel({
      question_id: newQuestion.id,
      question_type: body.question_type,
      choices: choices,
      inputs: inputs,
    }).addQuestionAnswers();

    res.status(200).json({
      message: "تم إضافة السؤال بنجاح",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const UpdateQuestion = async (req, res) => {
  try {
    const body = req.body;

    let choices = [];
    let inputs = [];

    if (body.question_type === "multiple-choice") {
      choices = JSON.parse(body.choices);
    }

    if (body.question_type === "input") {
      inputs = JSON.parse(body.inputs);
    }

    await new QuestionsModel({
      id: body.id,
      question: body.question,
      grade_id: body.grade_id,
      term_id: body.term_id,
      bank: body.bank,
    }).updateQuestion();

    new QuestionsModel({
      question_id: body.id,
      question_type: body.question_type,
      choices: choices,
      inputs: inputs,
    }).updateQuestionAnswers();

    res.json({
      message: "تم تعديل السؤال بنجاح",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const DeleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    await new QuestionsModel({ id }).Delete();
    res.status(201).json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error in deleting a question" });
  }
};

const GetTypeData = async (req, res) => {
  try {
    const { type, stage, term } = req.params;
    const data = await new QuestionsModel({ type, stage, term }).getTypeData();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const ConnectQuestion = async (req, res) => {
  try {
    const body = req.body;

    await new QuestionsModel({
      questions: body.questions,
      type: body.type,
      data_id: body.data_id,
    }).connectQuestions();
    res.status(200).json({
      message: "تم تسليم الاسئلة بنجاح",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const StudentQuestionsBank = async (req, res) => {
  try {
    const { stage, term } = req.params;
    var data = await new QuestionsModel({
      stage,
      term,
    }).Ditails();

    res.status(200).json({
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const StudentAnswers = async (req, res) => {
  try {
    const { stage, term, student_id } = req.params;
    const { answers, studentAnswers } = await new QuestionsModel({
      stage,
      term,
      student_id,
    }).Answers();

    const Answers = [];

    answers.forEach((answer) => {
      const existingAnswer = Answers.find((a) => answer.id === a.id);

      if (!existingAnswer) {
        Answers.push({
          id: answer.id,
          question: answer.question,
          the_answer: answer.the_answer === null ? null : [answer.the_answer],
          the_choice:
            answer.the_choice === null
              ? null
              : [
                  {
                    is_right: answer.is_right_choice,
                    choice: answer.the_choice,
                  },
                ],
          is_right_choice: answer.is_right_choice,
          student_answer: null,
          is_student_answer_right: null,
        });
      }

      if (existingAnswer) {
        if (answer.the_answer !== null) {
          existingAnswer.the_answer.push(answer.the_answer);
        }
        if (answer.the_choice !== null) {
          existingAnswer.the_choice.push({
            is_right: answer.is_right_choice,
            choice: answer.the_choice,
          });
        }
      }
    });

    studentAnswers.forEach((answer) => {
      const existingAnswer = Answers.find((a) => answer.question_id === a.id);

      if (existingAnswer) {
        if (answer.text_answer !== null) {
          if (
            existingAnswer.student_answer === null ||
            !Array.isArray(existingAnswer.student_answer)
          ) {
            existingAnswer.student_answer = [
              { id: answer.id, text_answer: answer.text_answer },
            ];
            existingAnswer.is_student_answer_right = [answer.is_right];
          } else {
            existingAnswer.student_answer.push({
              id: answer.id,
              text_answer: answer.text_answer,
            });
            existingAnswer.is_student_answer_right.push(answer.is_right);
          }
        } else if (answer.choice_answer !== null) {
          existingAnswer.student_answer = [
            { id: answer.id, choice_answer: answer.choice_answer },
          ];
          existingAnswer.is_student_answer_right = [answer.is_right];
        }
      }
    });

    res.status(200).json({
      answers: Answers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  GetQuestionsBank,
  SubmitAnswers,
  AllQuestions,
  CreateQuestion,
  DeleteQuestion,
  UpdateQuestion,
  GetTypeData,
  ConnectQuestion,
  StudentQuestionsBank,
  StudentAnswers,
};
