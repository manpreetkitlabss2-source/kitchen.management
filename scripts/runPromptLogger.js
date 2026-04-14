const logPrompt = require("./logPrompt");

const prompt = process.argv[2] || "No prompt provided";

logPrompt(prompt);