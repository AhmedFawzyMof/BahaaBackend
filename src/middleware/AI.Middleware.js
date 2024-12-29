const { GoogleGenerativeAI } = require("@google/generative-ai");

// eslint-disable-next-line no-undef
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_KEY);

async function GenrateAiPlan(subject, grade_name) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `هل تستطيع عمل خطة دراسية ل${grade_name} في مصر في مادة ${subject} اجب بلعرابية`;
  const result = await model.generateContent(prompt);

  return result.response.text();
}

module.exports = { GenrateAiPlan };
