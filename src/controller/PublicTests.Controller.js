const PublicTestsModel = require("../models/PublicTests.Model");
const StudentsModel = require("../models/Students.Model");
const Grades = require("../models/Grade.Model");
const { AutoCorrect, formatQuestions } = require("../utils/AutoCorrect");

const GetTestQuestions = async (req, res) => {
  try {
    const grade_id = req.params.student.grade_id;
    const student_id = req.params.student.id;
    const { id } = req.params;
    const test = await new PublicTestsModel({
      id,
      grade_id,
      student_id,
    }).getTestQuestions();

    const questions = [];
    for (const question of test) {
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
    res.status(500).json({ error: "حدث خطأ ما في الحصول على الاسئلة" });
  }
};

const SubmitTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, student_name, student_phone } = req.body;
    const test = await new PublicTestsModel({
      test_id: id,
    }).getTestQuestionsForAnswer();

    const questions = [];
    for (const question of test) {
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
        await new PublicTestsModel({
          name: student_name,
          phone: student_phone,
          questionId: answer.questionId,
          text_answer: null,
          choice_answer: answer.answer.the_answer,
          isRight: answer.answer.isRight,
          id: id,
        }).addAnswers();
      }
      if (answer.type === "input") {
        answer.answer.forEach(async (an) => {
          await new PublicTestsModel({
            name: student_name,
            phone: student_phone,
            questionId: answer.questionId,
            text_answer: an.the_answer,
            choice_answer: null,
            isRight: an.isRight,
            id: id,
          }).addAnswers();
        });
      }
    });

    await new PublicTestsModel({
      id: id,
      student_name,
      student_phone,
      result: result,
    }).addResult();

    res.json({
      message: "تم تسليم الاختبار بنجاح",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "حدث خطاء ما في الحصول على النتيجة" });
  }
};

const Results = async (req, res) => {
  try {
    const { id } = req.params.student;
    const results = await new StudentsModel({ id, type: "test" }).Results();
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const GetAllTestsTeacher = async (req, res) => {
  try {
    const { stage, limit } = req.params;

    const tests = await new PublicTestsModel({
      stage: parseInt(stage),
      limit: parseInt(limit),
    }).getAll();

    const grades = await new Grades({}).GetAll();

    res.status(200).json({ tests, grades });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const CreateTest = async (req, res) => {
  try {
    const test = req.body;

    const message = await new PublicTestsModel({
      test_name: test.test_name,
      grade_id: parseInt(test.grade),
      term_id: parseInt(test.term_id),
      created_at: test.created_at,
      expire_date: test.expire_date,
    }).Create();

    res.json({
      message: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const UpdateTest = async (req, res) => {
  try {
    const test = req.body;
    const message = await new PublicTestsModel({
      test_name: test.test_name,
      grade_id: test.grade,
      term_id: test.term_id,
      created_at: test.created_at,
      id: test.id,
    }).Update();
    res.json({
      message: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const DeleteTest = async (req, res) => {
  try {
    const id = req.params.id;

    const message = await new PublicTestsModel({
      id,
    }).Delete();

    res.json({
      message: message,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err });
  }
};

const CheckUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;

    const response = await new PublicTestsModel({
      id: id,
      student_name: name,
      student_phone: phone,
    }).CheckUser();

    res.status(200).json({
      message: response === undefined ? "لا يوجد مستخدم بهذه البيانات" : "",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const TestDitails = async (req, res) => {
  try {
    const { type, id } = req.params;
    var { passRate, avgGrade, data } = await new PublicTestsModel({
      id,
      type,
    }).Ditails();

    if (type === "questions") {
      data = formatQuestions(data);
    }

    res.status(200).json({
      passRate,
      avgGrade,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const TestAnswers = async (req, res) => {
  try {
    const { test_id, student_id } = req.params;
    console.log(req.params);
    const { testAnswers, studentAnswers } = await new PublicTestsModel({
      id: test_id,
      student_id,
    }).Answers();
    const TestAnswers = [];

    testAnswers.forEach((answer) => {
      const existingAnswer = TestAnswers.find((a) => answer.id === a.id);

      if (!existingAnswer) {
        TestAnswers.push({
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
      const existingAnswer = TestAnswers.find(
        (a) => answer.question_id === a.id
      );

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
      answers: TestAnswers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

module.exports = {
  GetTestQuestions,
  SubmitTest,
  Results,
  GetAllTestsTeacher,
  CreateTest,
  UpdateTest,
  DeleteTest,
  CheckUser,
  TestDitails,
  TestAnswers,
};
