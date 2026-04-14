const { logPre } = require("./aiLogger");

const prompt =
  process.env.AMAZON_Q_PROMPT ||
  process.argv.slice(2).join(" ") ||
  "No prompt captured";

logPre(prompt);