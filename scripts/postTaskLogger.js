const { logPost } = require("./aiLogger");

const prompt =
  process.env.AMAZON_Q_PROMPT ||
  "Unknown prompt";

const response =
  process.env.AMAZON_Q_RESPONSE ||
  "No response captured";

logPost(prompt, response);