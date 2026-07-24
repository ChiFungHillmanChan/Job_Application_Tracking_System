// ESM port of backend/services/jobBoards/index.js
import reedAdapter from './reedAdapter';
import adzunaAdapter from './adzunaAdapter';
import logger from '@/server/logger';

const adapters = {
  reed: reedAdapter,
  adzuna: adzunaAdapter
};

export function getAdapter(name) {
  const adapter = adapters[name];
  if (!adapter) {
    throw new Error(`Unknown job board adapter: ${name}`);
  }
  return adapter;
}

export function getConfiguredAdapters() {
  return Object.entries(adapters)
    .filter(([, adapter]) => adapter.isConfigured())
    .map(([name]) => name);
}

export async function searchAllBoards(query, location, filters = {}, boardNames = null) {
  const boardsToSearch = boardNames || getConfiguredAdapters();

  if (boardsToSearch.length === 0) {
    logger.warn('No job board adapters are configured');
    return { jobs: [], totalResults: 0, boardsSearched: [] };
  }

  const allJobs = [];
  const errors = [];
  const boardsSearched = [];
  let totalResults = 0;

  for (const boardName of boardsToSearch) {
    const adapter = adapters[boardName];
    if (!adapter) {
      errors.push({ board: boardName, error: 'Unknown adapter' });
      continue;
    }

    if (!adapter.isConfigured()) {
      logger.warn(`${boardName} adapter is not configured, skipping`);
      errors.push({ board: boardName, error: 'Not configured' });
      continue;
    }

    try {
      const result = await adapter.search(query, location, filters);
      allJobs.push(...result.jobs);
      totalResults += result.totalResults;
      boardsSearched.push(boardName);
    } catch (error) {
      logger.error(`Error searching ${boardName}: ${error.message}`);
      errors.push({ board: boardName, error: error.message });
    }
  }

  const deduplicatedJobs = deduplicateJobs(allJobs);

  return {
    jobs: deduplicatedJobs,
    totalResults,
    boardsSearched,
    errors
  };
}

function deduplicateJobs(jobs) {
  const seen = new Map();

  for (const job of jobs) {
    const key = `${job.company?.toLowerCase()?.trim()}_${job.title?.toLowerCase()?.trim()}`;

    if (!seen.has(key)) {
      seen.set(key, job);
    }
  }

  return Array.from(seen.values());
}

export { adapters };
