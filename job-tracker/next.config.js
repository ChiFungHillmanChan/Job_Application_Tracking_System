/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse (via pdfjs-dist) does dynamic/CJS-style requires that break
  // when webpack bundles it into the route handler graph (throws
  // "Object.defineProperty called on non-object" from pdfjs-dist's ESM
  // build at require time). Keeping it external forces Node's native
  // require instead, which resolves the package correctly. Discovered
  // while smoke-testing POST /api/profile/analyze (task 7), the first
  // caller of src/server/services/cvParser.js in this app.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
};

module.exports = nextConfig;