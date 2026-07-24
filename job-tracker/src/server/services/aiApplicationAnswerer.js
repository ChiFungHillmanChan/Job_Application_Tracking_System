// ESM port of backend/services/aiApplicationAnswerer.js
import { getOpenAI } from './openai';
import { loadPromptFile } from '@/server/utils/loadPrompt';
import logger from '@/server/logger';

const applicationAnswersSchema = {
  type: 'object',
  properties: {
    answers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' }
        },
        required: ['question', 'answer'],
        additionalProperties: false
      }
    }
  },
  required: ['answers'],
  additionalProperties: false
};

export async function generateApplicationAnswers(userProfile, jobData, questions) {
  const openai = getOpenAI();
  const systemPrompt = loadPromptFile('application-answers.txt');

  const profileText = formatProfile(userProfile);
  const jobText = formatJob(jobData);
  const questionsText = questions
    .map((q, i) => `${i + 1}. ${q}`)
    .join('\n');

  const response = await openai.responses.create({
    model: 'gpt-4.1',
    input: [
      {
        type: 'message',
        role: 'system',
        content: [{ type: 'input_text', text: systemPrompt }]
      },
      {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: [
            '## Candidate Profile',
            profileText,
            '',
            '## Job Posting',
            jobText,
            '',
            '## Application Questions',
            questionsText,
            '',
            'Please answer each question based on the candidate\'s profile.'
          ].join('\n')
        }]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'application_answers',
        schema: applicationAnswersSchema,
        strict: true
      }
    }
  });

  if (response.status !== 'completed') {
    throw new Error(`Application answers generation did not complete. Status: ${response.status}`);
  }

  const outputMessage = response.output.find(item => item.type === 'message');
  const textContent = outputMessage?.content?.find(item => item.type === 'output_text');

  if (!textContent?.text) {
    throw new Error('No text output received from application answers');
  }

  const result = JSON.parse(textContent.text);
  logger.info(`Generated ${result.answers.length} application answers for "${jobData.title}"`);
  return result.answers;
}

function formatProfile(profile) {
  const lines = [];
  if (profile.summary) lines.push(`Summary: ${profile.summary}`);
  if (profile.seniorityLevel) lines.push(`Level: ${profile.seniorityLevel}`);
  if (profile.skills?.technical?.length) {
    lines.push(`Technical Skills: ${profile.skills.technical.join(', ')}`);
  }
  if (profile.skills?.soft?.length) {
    lines.push(`Soft Skills: ${profile.skills.soft.join(', ')}`);
  }
  if (profile.experience?.length) {
    lines.push('Experience:');
    for (const exp of profile.experience) {
      lines.push(`- ${exp.title} at ${exp.company} (${exp.duration})`);
      if (exp.highlights?.length) {
        for (const h of exp.highlights) lines.push(`  * ${h}`);
      }
    }
  }
  if (profile.education?.length) {
    lines.push('Education:');
    for (const edu of profile.education) {
      lines.push(`- ${edu.degree} from ${edu.institution} (${edu.year})`);
    }
  }
  return lines.join('\n');
}

function formatJob(job) {
  const lines = [];
  lines.push(`Title: ${job.title || 'Unknown'}`);
  lines.push(`Company: ${job.company || 'Unknown'}`);
  if (job.location?.display || job.location) {
    lines.push(`Location: ${job.location?.display || job.location}`);
  }
  if (job.description) lines.push(`Description: ${job.description}`);
  return lines.join('\n');
}
