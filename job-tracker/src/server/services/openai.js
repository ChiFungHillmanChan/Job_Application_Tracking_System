// ESM port of backend/services/openai.js
import OpenAI from 'openai';

let openaiInstance = null;

// Model for all AI features; override with the OPENAI_MODEL env var.
// gpt-5.6-luna: latest-gen cost-sensitive tier ($1/$6 per M tokens, Jul 2026).
// Ultra-budget alternative: set OPENAI_MODEL=gpt-5.4-nano ($0.20/$1.25).
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.6-luna';

export function getOpenAI() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is not set. ' +
        'Please add it to your .env file: OPENAI_API_KEY=your-key-here'
      );
    }
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}
