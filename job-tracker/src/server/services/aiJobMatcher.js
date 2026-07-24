// ESM port of backend/services/aiJobMatcher.js
import { getOpenAI } from './openai';
import { loadPromptFile } from '@/server/utils/loadPrompt';
import logger from '@/server/logger';

const matchResultSchema = {
  type: 'object',
  properties: {
    matchScore: { type: 'number' },
    matchReasoning: { type: 'string' },
    strengthAreas: { type: 'array', items: { type: 'string' } },
    gapAreas: { type: 'array', items: { type: 'string' } },
    aiNotes: { type: 'string' }
  },
  required: ['matchScore', 'matchReasoning', 'strengthAreas', 'gapAreas', 'aiNotes'],
  additionalProperties: false
};

export async function scoreJobMatch(userProfile, jobData) {
  const openai = getOpenAI();
  const systemPrompt = loadPromptFile('job-matching.txt');

  const profileSummary = buildProfileSummary(userProfile);
  const jobSummary = buildJobSummary(jobData);

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
          text: `## Candidate Profile\n${profileSummary}\n\n## Job Posting\n${jobSummary}`
        }]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'job_match_result',
        schema: matchResultSchema,
        strict: true
      }
    }
  });

  if (response.status !== 'completed') {
    throw new Error(`Job matching did not complete. Status: ${response.status}`);
  }

  const outputMessage = response.output.find(item => item.type === 'message');
  const textContent = outputMessage?.content?.find(item => item.type === 'output_text');

  if (!textContent?.text) {
    throw new Error('No text output received from job matching');
  }

  const result = JSON.parse(textContent.text);
  result.matchScore = Math.max(0, Math.min(100, Math.round(result.matchScore)));

  logger.info(`Job match scored: ${result.matchScore}/100 for "${jobData.title}" at "${jobData.company}"`);
  return result;
}

export async function scoreBatchJobMatches(userProfile, jobs) {
  const results = [];

  for (const job of jobs) {
    try {
      const matchResult = await scoreJobMatch(userProfile, job);
      results.push({ job, ...matchResult });
    } catch (error) {
      logger.error(`Failed to score job "${job.title}": ${error.message}`);
      results.push({
        job,
        matchScore: 0,
        matchReasoning: 'Scoring failed',
        strengthAreas: [],
        gapAreas: [],
        aiNotes: `Error: ${error.message}`
      });
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

function buildProfileSummary(profile) {
  const parts = [];

  if (profile.summary) {
    parts.push(`Summary: ${profile.summary}`);
  }
  if (profile.seniorityLevel) {
    parts.push(`Seniority: ${profile.seniorityLevel}`);
  }
  if (profile.skills?.technical?.length) {
    parts.push(`Technical Skills: ${profile.skills.technical.join(', ')}`);
  }
  if (profile.skills?.soft?.length) {
    parts.push(`Soft Skills: ${profile.skills.soft.join(', ')}`);
  }
  if (profile.skills?.languages?.length) {
    parts.push(`Languages: ${profile.skills.languages.join(', ')}`);
  }
  if (profile.experience?.length) {
    const expSummary = profile.experience
      .map(e => `${e.title} at ${e.company} (${e.duration})`)
      .join('; ');
    parts.push(`Experience: ${expSummary}`);
  }
  if (profile.education?.length) {
    const eduSummary = profile.education
      .map(e => `${e.degree} from ${e.institution} (${e.year})`)
      .join('; ');
    parts.push(`Education: ${eduSummary}`);
  }
  if (profile.certifications?.length) {
    parts.push(`Certifications: ${profile.certifications.join(', ')}`);
  }
  if (profile.preferredRoles?.length) {
    parts.push(`Preferred Roles: ${profile.preferredRoles.join(', ')}`);
  }

  return parts.join('\n');
}

function buildJobSummary(job) {
  const parts = [];

  parts.push(`Title: ${job.title || 'Unknown'}`);
  parts.push(`Company: ${job.company || 'Unknown'}`);

  if (job.location?.display || job.location) {
    parts.push(`Location: ${job.location?.display || job.location}`);
  }
  if (job.salary?.display) {
    parts.push(`Salary: ${job.salary.display}`);
  }
  if (job.jobType) {
    parts.push(`Type: ${job.jobType}`);
  }
  if (job.workType) {
    parts.push(`Work Type: ${job.workType}`);
  }
  if (job.description) {
    parts.push(`Description: ${job.description}`);
  }
  if (job.requirements?.length) {
    parts.push(`Requirements: ${job.requirements.join(', ')}`);
  }

  return parts.join('\n');
}
