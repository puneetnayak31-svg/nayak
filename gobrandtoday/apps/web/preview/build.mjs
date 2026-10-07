// Builds the single-page preview: `node preview/build.mjs [outDir]`
// Output: index.html + app.js + app.css — no server needed.
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, '..');
const out = path.resolve(process.argv[2] ?? path.join(here, 'dist'));
mkdirSync(out, { recursive: true });

await build({
  entryPoints: [path.join(here, 'main.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  charset: 'ascii',
  jsx: 'automatic',
  outfile: path.join(out, 'app.js'),
  define: { 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_PREVIEW': '"1"', 'process.env.NEXT_PUBLIC_SITE_URL': '"https://gobrandtoday.com"' },
  alias: {
    'next/link': path.join(here, 'shims/next-link.tsx'),
    'next/navigation': path.join(here, 'shims/next-navigation.ts'),
    '@/lib/api': path.join(here, 'local-api.ts'),
    '@': web,
  },
  loader: { '.svg': 'text' },
  logLevel: 'warning',
});

const fonts = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Manrope:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap';
const html = readFileSync(path.join(here, 'index.html'), 'utf8').replace('%FONTS%', fonts);
writeFileSync(path.join(out, 'index.html'), html);
console.log(`Preview built → ${out}`);
