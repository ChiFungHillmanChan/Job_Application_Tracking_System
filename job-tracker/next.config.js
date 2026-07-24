const { withWorkflow } = require('workflow/next');

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
  // `xdg-app-paths` (pulled in transitively by the Workflow DevKit local-world
  // runtime that backs the generated /.well-known/workflow/* routes) derives a
  // name from its caller's module filename at import time via
  // `path.parse(<filename>)`. When webpack bundles it, that filename is
  // undefined during `next build`'s "collect page data" pass and it throws
  // `ERR_INVALID_ARG_TYPE`. Keeping it external forces Node's native require,
  // where the filename resolves correctly.
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', 'xdg-app-paths', '@napi-rs/canvas'],
  // pdfjs-dist loads @napi-rs/canvas (DOMMatrix polyfill) via a dynamic
  // require the file tracer can't see, so force-include it (and its
  // platform-specific binding packages) into every function bundle that
  // can reach cvParser.
  outputFileTracingIncludes: {
    '/api/**': ['./node_modules/@napi-rs/**', './node_modules/pdfjs-dist/**'],
    '/.well-known/workflow/**': ['./node_modules/@napi-rs/**', './node_modules/pdfjs-dist/**'],
  },
};

// withWorkflow enables the "use workflow" / "use step" directives (WDK compiler).
module.exports = withWorkflow(nextConfig);
