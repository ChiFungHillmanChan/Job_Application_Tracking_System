// ESM port of backend/services/aiProfileAnalyzer.js
import { getOpenAI, OPENAI_MODEL } from './openai';
import { loadPromptFile } from '@/server/utils/loadPrompt';
import logger from '@/server/logger';

const cvAnalysisSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    skills: {
      type: 'object',
      properties: {
        technical: { type: 'array', items: { type: 'string' } },
        soft: { type: 'array', items: { type: 'string' } },
        languages: { type: 'array', items: { type: 'string' } }
      },
      required: ['technical', 'soft', 'languages'],
      additionalProperties: false
    },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          company: { type: 'string' },
          duration: { type: 'string' },
          highlights: { type: 'array', items: { type: 'string' } }
        },
        required: ['title', 'company', 'duration', 'highlights'],
        additionalProperties: false
      }
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          degree: { type: 'string' },
          institution: { type: 'string' },
          year: { type: 'string' }
        },
        required: ['degree', 'institution', 'year'],
        additionalProperties: false
      }
    },
    certifications: { type: 'array', items: { type: 'string' } },
    preferredRoles: { type: 'array', items: { type: 'string' } },
    seniorityLevel: {
      type: 'string',
      enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'principal', 'executive']
    }
  },
  required: [
    'summary', 'skills', 'experience', 'education',
    'certifications', 'preferredRoles', 'seniorityLevel'
  ],
  additionalProperties: false
};

export async function analyzeCV(cvText) {
  const openai = getOpenAI();
  const systemPrompt = loadPromptFile('cv-analysis.txt');

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
          text: `Please analyze the following CV and extract structured information:\n\n${cvText}`
        }]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'cv_analysis',
        schema: cvAnalysisSchema,
        strict: true
      }
    }
  });

  if (response.status !== 'completed') {
    throw new Error(`CV analysis did not complete. Status: ${response.status}`);
  }

  const outputMessage = response.output.find(item => item.type === 'message');
  const textContent = outputMessage?.content?.find(item => item.type === 'output_text');

  if (!textContent?.text) {
    throw new Error('No text output received from CV analysis');
  }

  const result = JSON.parse(textContent.text);
  logger.info(`CV analyzed: ${result.experience.length} experiences, ${result.skills.technical.length} technical skills`);
  return result;
}
