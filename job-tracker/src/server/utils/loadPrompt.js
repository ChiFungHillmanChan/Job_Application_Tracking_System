// Resolves a named AI prompt.
//
// Originally read prompt .txt files from disk with fs (backend/utils/loadPrompt.js).
// That fails under the Workflow DevKit step runtime (/.well-known/workflow/v1/step):
// its serverless bundle is traced separately from /api/** and does NOT receive
// src/server/prompts/*.txt, so fs.readFileSync would ENOENT inside steps on
// Vercel (scoreJobMatch / generateCoverLetter run there). Prompts are now bundled
// as JS string constants in ./prompts/index.js, so they travel with every bundle
// and no filesystem access is needed.
import { prompts } from '@/server/prompts';

export function loadPromptFile(filename) {
  const content = prompts[filename];
  if (content === undefined) {
    throw new Error(`Unknown prompt file: ${filename}`);
  }
  return content;
}
