const OpenAI = require('openai');

let openaiInstance = null;

function getOpenAI() {
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

module.exports = { getOpenAI };
