// Shared normalization helpers for job board adapters.
//
// Every adapter's standardizeJob() output is fed straight into SavedJob (and,
// via the import route, into Job). Both schemas constrain `salary.currency`,
// `salary.period` and `description` length, so an adapter that passes a board's
// raw values through unchecked produces documents Mongoose rejects at save time
// - which surfaces to the user as a job that silently refuses to be saved.
// These helpers keep every adapter inside those constraints without inventing
// data: anything that cannot be mapped is left unset (the schema default then
// applies) while the human-readable `display` string preserves the board's
// original wording.

// Mirrors the SavedJob/Job `salary.currency` enum. Keep the three lists in sync.
export const SUPPORTED_CURRENCIES = [
  'GBP', 'USD', 'EUR', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK',
  'PLN', 'INR', 'SGD', 'HKD', 'JPY', 'NZD', 'ZAR', 'AED', 'BRL', 'MXN'
];

const CURRENCY_SYMBOLS = {
  GBP: '£', USD: '$', EUR: '€', CAD: 'CA$', AUD: 'A$', NZD: 'NZ$',
  JPY: '¥', INR: '₹', BRL: 'R$', MXN: 'MX$', HKD: 'HK$', SGD: 'S$'
};

// Mirrors the SavedJob `salary.period` enum.
export const SUPPORTED_PERIODS = ['annual', 'monthly', 'weekly', 'daily', 'hourly'];

// Boards spell the same period half a dozen ways: Adzuna uses nothing, JSearch
// uses SCREAMING_CASE ('YEAR'), Remotive uses snake_case ('yearly'), Jooble
// embeds it in free text ('per annum').
const PERIOD_ALIASES = {
  year: 'annual', yearly: 'annual', annual: 'annual', annually: 'annual',
  annum: 'annual', pa: 'annual', yr: 'annual',
  month: 'monthly', monthly: 'monthly', mo: 'monthly',
  week: 'weekly', weekly: 'weekly', wk: 'weekly',
  day: 'daily', daily: 'daily', diem: 'daily',
  hour: 'hourly', hourly: 'hourly', hr: 'hourly'
};

export function normalizeCurrency(raw) {
  if (!raw) return null;
  const code = String(raw).trim().toUpperCase();
  return SUPPORTED_CURRENCIES.includes(code) ? code : null;
}

export function normalizePeriod(raw) {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase().replace(/[^a-z]/g, '');
  return PERIOD_ALIASES[key] || (SUPPORTED_PERIODS.includes(key) ? key : null);
}

function formatAmount(amount, currency) {
  const rounded = Math.round(amount);
  const symbol = currency ? CURRENCY_SYMBOLS[currency] : null;
  if (symbol) return `${symbol}${rounded.toLocaleString('en-GB')}`;
  if (currency) return `${currency} ${rounded.toLocaleString('en-GB')}`;
  return rounded.toLocaleString('en-GB');
}

// Builds the salary sub-document. `currency`/`period` are omitted entirely when
// they cannot be mapped to the schema enum, so Mongoose applies its default
// rather than throwing - but `display` still carries the truth for the user.
// `rawDisplay` (boards like Jooble only give free text) wins over the generated
// string when no numeric bounds were parsed.
export function buildSalary({ min, max, currency, period, rawDisplay } = {}) {
  const code = normalizeCurrency(currency);
  const per = normalizePeriod(period);

  const result = {};
  if (code) result.currency = code;
  if (per) result.period = per;

  const lo = Number(min) > 0 ? Number(min) : null;
  const hi = Number(max) > 0 ? Number(max) : null;
  if (lo) result.min = lo;
  if (hi) result.max = hi;

  const suffix = per ? ` ${per}` : '';
  // Preserve the board's own currency label when it is outside our enum, so a
  // CAD salary never renders as if it were GBP.
  const label = code || (currency ? String(currency).toUpperCase() : null);

  if (lo && hi) {
    result.display = `${formatAmount(lo, label)} - ${formatAmount(hi, label)}${suffix}`;
  } else if (lo) {
    result.display = `From ${formatAmount(lo, label)}${suffix}`;
  } else if (hi) {
    result.display = `Up to ${formatAmount(hi, label)}${suffix}`;
  } else if (rawDisplay) {
    result.display = String(rawDisplay).trim();
  }

  return result;
}

const ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  '&apos;': "'", '&nbsp;': ' ', '&ndash;': '-', '&mdash;': '-', '&hellip;': '...'
};

// SavedJob caps `description` at 5000 characters. Reed and Adzuna return short
// snippets so the cap never bit, but Arbeitnow/Remotive/JSearch return the full
// HTML job post - frequently 10-30k characters - which would fail validation on
// every save. Strip markup, collapse whitespace, then truncate on a word
// boundary.
export function sanitizeDescription(raw, maxLength = 4900) {
  if (!raw) return '';

  const text = String(raw)
    .replace(/<\s*(br|\/p|\/li|\/div|\/h[1-6])\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;|&#39;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? ' ')
    .replace(/[ \t ]+/g, ' ')
    // Inline tags sitting on a block boundary ("</strong></p>") leave a space
    // stranded on each side of the newline inserted above.
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');

  if (text.length <= maxLength) return text;

  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.8 ? cut.slice(0, lastSpace) : cut).trimEnd()}...`;
}

// SavedJob requires a non-empty description; a board that returns none would
// otherwise fail validation the moment the user clicks Save.
export function describeJob(raw, fallback) {
  const clean = sanitizeDescription(raw);
  return clean || fallback || 'No description provided by the job board.';
}

// Recognizes the contract types actually named in a board's free-text labels.
// Returns [] when nothing is recognizable, which callers must treat as "no
// information" rather than "no match" - Arbeitnow's `job_types`, for instance,
// carries an ATS seniority taxonomy ('professional / experienced', 'executive',
// 'berufserfahren', 'Working student') that says nothing about contract type.
export function detectJobTypes(...candidates) {
  const found = new Set();

  for (const candidate of candidates.flat()) {
    if (!candidate) continue;
    const value = String(candidate).toLowerCase();
    if (value.includes('intern')) found.add('internship');
    if (value.includes('contract')) found.add('contract');
    if (value.includes('temp')) found.add('temporary');
    if (value.includes('part')) found.add('part-time');
    if (value.includes('full')) found.add('full-time');
    if (value.includes('permanent')) found.add('permanent');
  }

  return [...found];
}

// SavedJob's `jobType` enum. Boards use wildly different vocabularies
// ('FULLTIME', 'full_time', 'Full-time', 'CONTRACTOR', 'permanent'). Falls back
// to 'permanent' because the schema requires a value.
export function normalizeJobType(...candidates) {
  return detectJobTypes(...candidates)[0] || 'permanent';
}

// True when a job should survive a jobTypes filter. A job whose labels name no
// recognizable contract type passes: rejecting it would silently drop most of
// the feed-based boards, which usually leave the field blank or non-standard.
export function matchesJobTypes(requested, ...candidates) {
  if (!requested?.length) return true;
  const detected = detectJobTypes(...candidates);
  if (!detected.length) return true;
  return detected.some((t) => requested.includes(t));
}

// SavedJob's `workType` enum.
export function normalizeWorkType({ isRemote, location, tags } = {}) {
  if (isRemote === true) return 'remote';
  const haystack = [location, ...(Array.isArray(tags) ? tags : [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (haystack.includes('hybrid')) return 'hybrid';
  if (haystack.includes('remote') || haystack.includes('anywhere')) return 'remote';
  return 'onsite';
}

// SavedJob requires `applicationUrl` to match /^https?:\/\/.+/. Boards
// occasionally emit protocol-relative or bare-host URLs.
export function normalizeUrl(raw) {
  if (!raw) return '';
  const value = String(raw).trim();
  if (/^https?:\/\/.+/i.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(value)) return `https://${value}`;
  return '';
}

// SavedJob requires `postedDate`. Boards return ISO strings, unix seconds,
// unix milliseconds, and UK-format DD/MM/YYYY.
export function parseDate(value) {
  if (!value) return null;

  if (typeof value === 'number') {
    // Anything below this threshold is seconds, not milliseconds.
    const ms = value < 1e11 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const str = String(value).trim();
  const uk = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
  if (uk) {
    const d = new Date(`${uk[3]}-${uk[2]}-${uk[1]}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (/^\d+$/.test(str)) return parseDate(Number(str));

  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}
