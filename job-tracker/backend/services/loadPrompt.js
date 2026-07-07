const fs = require('fs');
const path = require('path');

const promptCache = new Map();

function loadPromptFile(filename) {
  if (promptCache.has(filename)) {
    return promptCache.get(filename);
  }

  const promptPath = path.join(__dirname, '../../prompts', filename);
  const content = fs.readFileSync(promptPath, 'utf-8');
  promptCache.set(filename, content);
  return content;
}

module.exports = { loadPromptFile };
