const fs = require("fs");
const path = require("path");

const logFilePath = path.join(
  __dirname,
  "..",
  ".ai-logs",
  "prompt-log.md"
);

function logPrompt(prompt, summary = "", files = []) {
  try {
    const timestamp = new Date().toLocaleString();

    const entry = `
================================================

Time: ${timestamp}

Prompt:
${prompt}

Summary:
${summary}

Files:
${files.join(", ")}

================================================
`;

    fs.appendFileSync(logFilePath, entry);

    console.log("Prompt logged successfully.");
  } catch (error) {
    console.error("Logging failed:", error);
  }
}

module.exports = logPrompt;