const VideosModel = require("../models/Videos.Model");
const StudentsModel = require("../models/Students.Model");
const Grades = require("../models/Grade.Model");
const { AutoCorrect, formatQuestions } = require("../utils/AutoCorrect");

const GetAllVideosTeacher = async (req, res) => {
  try {
    const { stage, term, limit } = req.params;

    const videos = await new VideosModel({
      stage: parseInt(stage),
      limit: parseInt(limit),
      term: parseInt(term),
    }).getAll();

    const grades = await new Grades({}).GetAll();
    res.status(200).json({ grades, videos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const CreateVideo = async (req, res) => {
  try {
    const video = req.body;

    const message = await new VideosModel({
      title: video.title,
      link: video.link,
      grade_id: parseInt(video.grade),
      term_id: parseInt(video.term_id),
    }).Create();

    res.json({
      message: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const UpdateVideo = async (req, res) => {
  try {
    const video = req.body;
    const message = await new VideosModel({
      title: video.title,
      link: video.link,
      grade_id: parseInt(video.grade_id),
      term_id: parseInt(video.term_id),
      id: video.id,
    }).Update();
    res.json({
      message: message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const DeleteVideos = async (req, res) => {
  try {
    const id = req.params.id;

    const message = await new VideosModel({
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

const VideoDitails = async (req, res) => {
  try {
    const { type, id } = req.params;

    var { passRate, avgGrade, data, video_link } = await new VideosModel({
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
      video_link,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const GetAllVideos = async (req, res) => {
  try {
    const { grade_id } = req.params.student;
    const { limit } = req.params;

    const videos = await new VideosModel({
      grade_id,
      limit,
    }).GetAllVideos();

    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "حدث خطأ ما في الحصول على الواجبات" });
  }
};

const Results = async (req, res) => {
  try {
    const { id } = req.params.student;
    const results = await new StudentsModel({ id, type: "video" }).Results();
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

const GetVideoQuestions = async (req, res) => {
  try {
    const grade_id = req.params.student.grade_id;
    const student_id = req.params.student.id;
    const { id } = req.params;
    const video = await new VideosModel({
      id,
      grade_id,
      student_id,
    }).getVideoQuestions();

    const questions = [];
    for (const question of video.video_questions) {
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

    res.json({ questions, video_ditails: video.video_ditails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "حدث خطأ ما في الحصول على الاسئلة" });
  }
};

const SubmitAnswers = async (req, res) => {
  try {
    const grade_id = req.params.student.grade_id;
    const student_id = req.params.student.id;
    const { id } = req.params;

    const answers = req.body;

    const video = await new VideosModel({
      id,
      grade_id,
      student_id,
    }).getVideoQuestionsForAnswer();

    const questions = [];
    for (const question of video) {
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
          student_id: student_id,
          question_id: answer.questionId,
          text_answer: null,
          choice_answer: answer.answer.the_answer,
          isRight: answer.answer.isRight,
          video_id: id,
        });
      }
      if (answer.type === "input") {
        answer.answer.forEach((input) => {
          answersToInsert.push({
            student_id: student_id,
            question_id: answer.questionId,
            text_answer: input.the_answer,
            choice_answer: null,
            isRight: input.isRight,
            video_id: id,
          });
        });
      }
    });

    await new VideosModel({ answers: answersToInsert }).addAnswers();

    await new VideosModel({
      id: id,
      studentId: student_id,
      result: result,
    }).addResult();

    res.json({
      message: "تم تسليم الاجابات بنجاح",
    });
  } catch (error) {
    console.error(error);
  }
};

const VideoAnswers = async (req, res) => {
  try {
    const { video_id, student_id } = req.params;
    const { videoAnswers, studentAnswers, published } = await new VideosModel({
      id: video_id,
      student_id,
    }).Answers();
    const VideoAnswers = [];

    videoAnswers.forEach((answer) => {
      const existingAnswer = VideoAnswers.find((a) => answer.id === a.id);

      if (!existingAnswer) {
        VideoAnswers.push({
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
      const existingAnswer = VideoAnswers.find(
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
      published: published,
      answers: VideoAnswers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

module.exports = {
  GetAllVideosTeacher,
  CreateVideo,
  UpdateVideo,
  DeleteVideos,
  VideoDitails,
  GetAllVideos,
  GetVideoQuestions,
  Results,
  SubmitAnswers,
  VideoAnswers,
};
