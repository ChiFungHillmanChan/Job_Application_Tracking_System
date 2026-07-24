// Cross-board deduplication.
//
// Duplicates are the main cost of adding job board sources: the same role is
// routinely syndicated to Reed, Adzuna and Indeed at once, so a user searching
// four boards sees the same posting four times. The original key was
// `company_title` built from raw strings, which missed every case where two
// boards spelled the employer differently ("Monzo" vs "Monzo Bank Ltd").
//
// Kept dependency-free and in its own module so the matching rules can be
// exercised directly - they are pure string logic and easy to get subtly wrong.
//
// DELIBERATELY CONSERVATIVE. Matching is exact on the normalized triple
// (company, title, city), so it collapses casing, punctuation, legal-form
// suffixes and location verbosity, but NOT genuinely different trading names -
// "Monzo" and "Monzo Bank" stay separate, as do a recruiter's listing and the
// direct employer's listing of the same role. Fuzzy company matching would
// close that gap at the risk of merging two distinct openings, and for a job
// seeker a visible duplicate costs far less than a hidden vacancy. Duplicates
// that survive are surfaced, not silently dropped.

// Tie-break order when the same posting is found on several boards: earlier
// entries win an otherwise-equal richness comparison. Reed and Adzuna lead
// because their records carry structured salary bounds.
export const BOARD_PRIORITY = ['reed', 'adzuna', 'jsearch', 'jooble', 'remotive', 'arbeitnow'];

// Legal-form suffixes and recruiter boilerplate that differ between boards for
// the same employer.
const COMPANY_NOISE =
  /\b(ltd|limited|inc|incorporated|llc|llp|plc|gmbh|ag|bv|nv|sa|sas|srl|oy|ab|as|pty|co|corp|corporation|company|group|holdings|international|global|uk|usa)\b/g;

export function normalizeCompany(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(COMPANY_NOISE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    // Boards bolt reference codes and qualifiers onto titles:
    // "Software Engineer (Remote) - REF12345".
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(ref|job|id)[\s:#-]*[a-z0-9-]{3,}\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Only the leading component: boards render the same place as "London",
// "London, Greater London" and "London, England, United Kingdom". Deliberately
// NOT dropped entirely - two genuinely different postings for the same role in
// different cities must stay separate.
export function normalizeCity(value) {
  return String(value || '')
    .toLowerCase()
    .split(',')[0]
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dedupeKey(job) {
  return [
    normalizeCompany(job.company),
    normalizeTitle(job.title),
    normalizeCity(job.location?.display)
  ].join('|');
}

// How much signal a record carries, used to decide which copy of a duplicate to
// keep. A Reed listing with salary bounds and a logo beats a bare Arbeitnow
// stub for the same role.
export function richness(job) {
  let score = 0;
  if (job.salary?.min || job.salary?.max) score += 3;
  else if (job.salary?.display) score += 1;
  if (job.location?.coordinates) score += 1;
  if (job.logoUrl) score += 1;
  if (job.companyUrl) score += 1;
  score += Math.min((job.description || '').length / 1000, 3);
  const rank = BOARD_PRIORITY.indexOf(job.source);
  score += rank === -1 ? 0 : (BOARD_PRIORITY.length - rank) * 0.1;
  return score;
}

export function deduplicateJobs(jobs) {
  const seen = new Map();

  for (const job of jobs) {
    const key = dedupeKey(job);
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, { ...job, alsoOn: [] });
      continue;
    }

    // Record every board the posting appeared on, whichever copy survives, so
    // the UI can show "also on Adzuna" instead of hiding the overlap entirely.
    const merged = new Set([...(existing.alsoOn || []), existing.source, job.source]);

    if (richness(job) > richness(existing)) {
      merged.delete(job.source);
      seen.set(key, { ...job, alsoOn: [...merged] });
    } else {
      merged.delete(existing.source);
      existing.alsoOn = [...merged];
    }
  }

  return Array.from(seen.values());
}
