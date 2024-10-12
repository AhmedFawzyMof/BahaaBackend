const TestsModel = require("../models/Tests.Model");
const StudentsModel = require("../models/Students.Model");
const { AutoCorrect } = require("../utils/AutoCorrect");

const GetTests = async (req, res) => {
  try {
    const { id, grade_id } = req.params.student;
    const tests = await TestsModel.getTests(id, grade_id);
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

const GetAllTests = async (req, res) => {
  try {
    const { id, grade_id } = req.params.student;
    const { limit } = req.params;

    const tests = await TestsModel.getAllTests(id, grade_id, limit);
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

const GetTestQuestions = async (req, res) => {
  try {
    const grade_id = req.params.student.grade_id;
    const student_id = req.params.student.id;
    const { id } = req.params;
    const test = await new TestsModel({
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
    console.log(error);
    res.status(500).json({ error: "حدث خطأ ما في الحصول على الاسئلة" });
  }
};

const SubmitTest = async (req, res) => {
  try {
    const grade_id = req.params.student.grade_id;
    const student_id = req.params.student.id;
    const { id } = req.params;
    const answers = req.body;
    const test = await new TestsModel({
      id,
      grade_id,
      student_id,
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
        await new TestsModel({
          studentId: student_id,
          questionId: answer.questionId,
          text_answer: null,
          choice_answer: answer.answer.the_answer,
          isRight: answer.answer.isRight,
          id: id,
        }).addAnswers();
      }
      if (answer.type === "input") {
        answer.answer.forEach(async (an) => {
          await new TestsModel({
            studentId: student_id,
            questionId: answer.questionId,
            text_answer: an.the_answer,
            choice_answer: null,
            isRight: an.isRight,
            id: id,
          }).addAnswers();
        });
      }
    });

    await new TestsModel({
      id: id,
      studentId: student_id,
      result: result,
    }).addResult();

    res.json({
      message: "تم تسليم الاختبار بنجاح",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "حدث خطاء ما في الحصول على النتيجة" });
  }
};

const Results = async (req, res) => {
  try {
    const { id } = req.params.student;
    const results = await new StudentsModel({ id, type: "test" }).Results();
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

module.exports = {
  GetTests,
  GetAllTests,
  GetTestQuestions,
  SubmitTest,
  Results,
};
