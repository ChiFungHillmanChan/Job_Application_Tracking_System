// ESM port of backend/services/aiCoverLetterWriter.js
import { getOpenAI, OPENAI_MODEL } from './openai';
import { loadPromptFile } from '@/server/utils/loadPrompt';
import logger from '@/server/logger';

const coverLetterSchema = {
  type: 'object',
  properties: {
    coverLetter: { type: 'string' },
    keyPointsHighlighted: { type: 'array', items: { type: 'string' } }
  },
  required: ['coverLetter', 'keyPointsHighlighted'],
  additionalProperties: false
};

export async function generateCoverLetter(userProfile, jobData) {
  const openai = getOpenAI();
  const systemPrompt = loadPromptFile('cover-letter.txt');

  const profileText = formatProfileForPrompt(userProfile);
  const jobText = formatJobForPrompt(jobData);

  const response = await openai.responses.create({
    model: OPENAI_MODEL,
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
          text: `## Candidate Profile\n${profileText}\n\n## Job Posting\n${jobText}\n\nPlease write a tailored cover letter.`
        }]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'cover_letter_result',
        schema: coverLetterSchema,
        strict: true
      }
    }
  });

  if (response.status !== 'completed') {
    throw new Error(`Cover letter generation did not complete. Status: ${response.status}`);
  }

  // response.output_text concatenates every output_text part — GPT-5.x can
  // split structured output across multiple parts/messages.
  const outputText = response.output_text;

  if (!outputText) {
    throw new Error('No text output received from cover letter generation');
  }

  const result = JSON.parse(outputText);
  logger.info(`Cover letter generated for "${jobData.title}" at "${jobData.company}" (${result.coverLetter.length} chars)`);
  return result;
}

function formatProfileForPrompt(profile) {
  const lines = [];
  if (profile.summary) lines.push(`Summary: ${profile.summary}`);
  if (profile.skills?.technical?.length) {
    lines.push(`Technical Skills: ${profile.skills.technical.join(', ')}`);
  }
  if (profile.experience?.length) {
    lines.push('Experience:');
    for (const exp of profile.experience) {
      lines.push(`- ${exp.title} at ${exp.company} (${exp.duration})`);
      if (exp.highlights?.length) {
        for (const h of exp.highlights) {
          lines.push(`  * ${h}`);
        }
      }
    }
  }
  if (profile.education?.length) {
    lines.push('Education:');
    for (const edu of profile.education) {
      lines.push(`- ${edu.degree} from ${edu.institution} (${edu.year})`);
    }
  }
  if (profile.certifications?.length) {
    lines.push(`Certifications: ${profile.certifications.join(', ')}`);
  }
  return lines.join('\n');
}

function formatJobForPrompt(job) {
  const lines = [];
  lines.push(`Title: ${job.title || 'Unknown'}`);
  lines.push(`Company: ${job.company || 'Unknown'}`);
  if (job.location?.display || job.location) {
    lines.push(`Location: ${job.location?.display || job.location}`);
  }
  if (job.salary?.display) lines.push(`Salary: ${job.salary.display}`);
  if (job.description) lines.push(`Description: ${job.description}`);
  if (job.requirements?.length) {
    lines.push(`Requirements: ${job.requirements.join(', ')}`);
  }
  return lines.join('\n');
}
