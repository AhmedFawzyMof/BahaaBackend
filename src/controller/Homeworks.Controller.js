const Homeworks = require("../models/Homeworks.Model");
const StudentsModel = require("../models/Students.Model");
const Grades = require("../models/Grade.Model");
const { AutoCorrect } = require("../utils/AutoCorrect");

const GetHomeworks = async (req, res) => {
  try {
    const { id, grade_id } = req.params.student;
    const homeworks = await Homeworks.getHomeworks(id, grade_id);
    res.json(homeworks);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "حدث خطأ ما في الحصول على الواجبات" });
  }
};

const GetAllHomeworks = async (req, res) => {
  try {
    const { id, grade_id } = req.params.student;
    const { limit } = req.params;

    const homeworks = await Homeworks.getAllHomeworks(id, grade_id, limit);
    res.json(homeworks);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "حدث خطأ ما في الحصول على الواجبات" });
  }
};

const GetHomeworkQuestions = async (req, res) => {
  try {
    const grade_id = req.params.student.grade_id;
    const student_id = req.params.student.id;
    const { id } = req.params;
    const homework = await new Homeworks({
      id,
      grade_id,
      student_id,
    }).getHomeworkQuestions();

    if (homework instanceof Error) {
      return res.status(500).json({ error: "الواجب تم حله بالفعل" });
    }

    const questions = [];
    for (const question of homework) {
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

const SubmitHomework = async (req, res) => {
  try {
    const grade_id = req.params.student.grade_id;
    const student_id = req.params.student.id;
    const { id } = req.params;

    const answers = req.body;

    const homework = await new Homeworks({
      id,
      grade_id,
      student_id,
    }).getHomeworkQuestionsForAnswer();

    const questions = [];
    for (const question of homework) {
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

    const answersToInsert = [];

    newAnswers.forEach((answer) => {
      if (answer.type === "choice") {
        answersToInsert.push({
          studentId: student_id,
          questionId: answer.questionId,
          text_answer: null,
          choice_answer: answer.answer.the_answer,
          isRight: answer.answer.isRight,
          homeworkId: id,
        });
      } else if (answer.type === "input") {
        answer.answer.forEach((an) => {
          answersToInsert.push({
            studentId: student_id,
            questionId: answer.questionId,
            text_answer: an.the_answer,
            choice_answer: null,
            isRight: an.isRight,
            homeworkId: id,
          });
        });
      }
    });

    await new Homeworks({ answers }).addAnswers();

    await new Homeworks({
      id: id,
      studentId: student_id,
      result: result,
    }).addResult();

    res.json({
      message: "تم تسليم الواجبات بنجاح",
    });
  } catch (error) {
    console.log(error);
  }
};

const Results = async (req, res) => {
  try {
    const { id } = req.params.student;
    const results = await new StudentsModel({ id, type: "homework" }).Results();
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

const GetAllHomeworksTeacher = async (req, res) => {
  try {
    const { stage, limit } = req.params;

    const homeworks = await new Homeworks({
      stage: parseInt(stage),
      limit: parseInt(limit),
    }).getAll();

    const grades = await new Grades({}).GetAll();
    res.status(200).json({ homeworks, grades });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

const CreateHomework = async (req, res) => {
  try {
    const homework = req.body;

    let cover = null;
    if (req.file) {
      cover = req.file.filename;
    }

    console.log(cover);

    const message = await new Homeworks({
      homework_name: homework.homework_name,
      cover: cover,
      grade_id: parseInt(homework.grade),
      term_id: parseInt(homework.term_id),
      created_at: homework.created_at,
    }).Create();

    res.json({
      message: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const UpdateHomework = async (req, res) => {
  try {
    const homework = req.body;
    const message = await new Homeworks({
      homework_name: homework.homework_name,
      grade_id: homework.grade,
      term_id: homework.term_id,
      created_at: homework.created_at,
      id: homework.id,
    }).Update();
    res.json({
      message: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const DeleteHomework = async (req, res) => {
  try {
    const id = req.params.id;

    const message = await new Homeworks({
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

module.exports = {
  GetHomeworks,
  GetAllHomeworks,
  GetHomeworkQuestions,
  GetAllHomeworksTeacher,
  SubmitHomework,
  Results,
  CreateHomework,
  DeleteHomework,
  UpdateHomework,
};
