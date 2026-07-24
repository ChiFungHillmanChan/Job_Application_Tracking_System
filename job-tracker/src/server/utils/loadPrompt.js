// ESM port of backend/utils/loadPrompt.js (originally backend/services/loadPrompt.js).
// Per task-3 brief rule 2, reads from src/server/prompts relative to
// process.cwd() instead of __dirname-relative ../../prompts; in-memory
// cache behavior is unchanged.
import fs from 'fs';
import path from 'path';

const promptCache = new Map();

export function loadPromptFile(filename) {
  if (promptCache.has(filename)) {
    return promptCache.get(filename);
  }

  const promptPath = path.join(process.cwd(), 'src/server/prompts', filename);
  const content = fs.readFileSync(promptPath, 'utf-8');
  promptCache.set(filename, content);
  return content;
}
