// Shared request-parsing helpers for route handlers.
//
// These exist because the same three classes of bug were found in several
// handlers during the 2026-07-24 review:
//   1. user input interpolated straight into a RegExp (a search for "C++"
//      threw SyntaxError -> 500),
//   2. `await request.json()` on an empty body throwing instead of 400,
//   3. `parseInt(<garbage>)` producing NaN that flowed into `.limit()`/`.skip()`
//      and into the JSON pagination block as `null`.
// Keeping one implementation avoids them drifting apart again.

// Escapes every RegExp metacharacter so a user's literal search string is
// matched literally. Without this, "C++", "(", "*", "[" and "?" are all
// invalid patterns and throw.
export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parses `page`/`limit` query params into safe positive integers.
// Anything non-numeric, zero, or negative falls back to the default; `limit`
// is additionally capped so a client cannot ask for an unbounded page.
export function parsePagination(searchParams, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const rawPage = Number.parseInt(searchParams.get('page'), 10);
  const rawLimit = Number.parseInt(searchParams.get('limit'), 10);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit;

  return { page, limit, skip: (page - 1) * limit };
}

// Copies only `allowedFields` out of a request body. Prevents mass assignment:
// without it, `{ ...body }` in a findByIdAndUpdate lets a client rewrite any
// schema path, including `user` (i.e. hand their own document to someone else).
export function pickAllowed(body, allowedFields) {
  const out = {};
  if (!body || typeof body !== 'object') return out;
  for (const field of allowedFields) {
    if (body[field] !== undefined) out[field] = body[field];
  }
  return out;
}

// `request.json()` throws on an empty or malformed body. Handlers want to fall
// through to their own "missing required field" 400 instead of surfacing a 500,
// so this resolves to `{}` on parse failure (the pattern already used by
// api/subscription/create-checkout-session).
export async function readJsonBody(request) {
  return request.json().catch(() => ({}));
}

// Coerces a client-supplied value to a finite number, or returns null. Used for
// numeric filters that are otherwise passed straight into a Mongo comparison
// operator (where an object like {"$gt":""} would become an injected operator).
export function toFiniteNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
