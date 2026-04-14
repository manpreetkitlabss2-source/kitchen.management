const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function getTodayFilePath() {
  const today = new Date().toISOString().split("T")[0];

  return path.join(
    __dirname,
    "..",
    ".ai-logs",
    `${today}.json`
  );
}

function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
}

function getChangedFiles() {
  try {
    const output = execSync(
      "git diff --name-only",
      { encoding: "utf-8" }
    );

    return output
      .split("\n")
      .filter(Boolean);

  } catch {
    return [];
  }
}

function writeLog(entry) {
  const filePath = getTodayFilePath();

  ensureFileExists(filePath);

  const logs = JSON.parse(
    fs.readFileSync(filePath)
  );

  logs.push(entry);

  fs.writeFileSync(
    filePath,
    JSON.stringify(logs, null, 2)
  );
}

function logPre(prompt) {
  const entry = {
    timestamp: new Date().toISOString(),
    type: "PROMPT",
    prompt
  };

  writeLog(entry);
}

function logPost(prompt, response) {
  const entry = {
    timestamp: new Date().toISOString(),
    type: "RESPONSE",
    prompt,
    response,
    changedFiles: getChangedFiles()
  };

  writeLog(entry);
}

module.exports = {
  logPre,
  logPost
};