#!/usr/bin/env node
/**
 * Press release PDF generator — InovCitrus PT (Dia 7).
 * Reads inovcitrus-kit-imprensa/press-release-pt.md, builds A4 portrait HTML
 * (same Frusoal InovCitrus header padrão), drives system Chrome
 * via --headless --print-to-pdf.
 *
 * Run from `04-landing/inovcitrus-pdfs/`:
 *   node scripts/generate-press-release-pdf.mjs
 *
 * Zero new dependencies. Reuses Chrome + inovcitrus-site/node_modules
 * (gray-matter, remark, remark-html, remark-gfm) já disponíveis desde Dia 5.
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PDF_ROOT = resolve(__dirname, '..');
const SITE_ROOT = resolve(PDF_ROOT, '..', 'inovcitrus-site');
const KIT_DIR = resolve(PDF_ROOT, '..', 'inovcitrus-kit-imprensa');
const OUTPUT_DIR = resolve(PDF_ROOT, 'output');
const TMP_DIR = resolve(PDF_ROOT, '.tmp-html');

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PRINT_CSS = `
@page { size: A4; margin: 18mm 18mm 20mm 18mm; }
@media print { html, body { background: #ffffff !important; } }
* { box-sizing: border-box; }
html, body { background: #ffffff; color: #1A1A1A; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10.5pt; line-height: 1.55; margin: 0; padding: 0; }
.doc { max-width: 174mm; margin: 0 auto; }

.doc-header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 6pt; border-bottom: 2pt solid #E8A53C; margin-bottom: 14pt; }
.doc-header .wordmark { font-size: 12pt; }
.doc-header .wordmark .frusoal { font-weight: 400; }
.doc-header .wordmark .inovcitrus { font-weight: 800; color: #C68420; }
.doc-header .meta { font-size: 8pt; color: #6B6B6B; letter-spacing: 0.06em; text-transform: uppercase; }

h1 { font-size: 19pt; font-weight: 800; margin: 0 0 8pt 0; line-height: 1.2; color: #1A1A1A; letter-spacing: -0.01em; }
h2 { font-size: 12pt; font-weight: 700; margin: 14pt 0 4pt 0; padding-bottom: 3pt; border-bottom: 1px solid #E5E2DA; color: #1A1A1A; }
h3 { font-size: 10.5pt; font-weight: 700; margin: 10pt 0 3pt 0; color: #1A1A1A; }
p { margin: 5pt 0; color: #3A3A3A; }
strong { color: #1A1A1A; font-weight: 700; }
em { color: #3A3A3A; }
a { color: #C68420; text-decoration: none; }
ul, ol { margin: 4pt 0 4pt 18pt; padding: 0; color: #3A3A3A; }
li { margin: 2pt 0; }
blockquote { border-left: 3pt solid #E8A53C; background: #FAF8F4; margin: 8pt 0; padding: 6pt 10pt; color: #3A3A3A; }
blockquote p { margin: 2pt 0; }
hr { border: none; border-top: 1px solid #E5E2DA; margin: 12pt 0; }

.doc-footer { margin-top: 14pt; padding-top: 6pt; border-top: 1pt solid #E5E2DA; font-size: 8pt; color: #6B6B6B; display: flex; justify-content: space-between; }
.body :first-child { margin-top: 0; }
`;

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

async function loadDeps() {
  const m = (rel) => `file:///${SITE_ROOT.replaceAll('\\', '/')}/node_modules/${rel}`;
  const [matterMod, remarkMod, remarkHtmlMod, remarkGfmMod] = await Promise.all([
    import(m('gray-matter/index.js')),
    import(m('remark/index.js')),
    import(m('remark-html/index.js')),
    import(m('remark-gfm/index.js')),
  ]);
  return {
    matter: matterMod.default ?? matterMod,
    remark: remarkMod.remark ?? (remarkMod.default && remarkMod.default.remark) ?? remarkMod.default,
    remarkHtml: remarkHtmlMod.default ?? remarkHtmlMod,
    remarkGfm: remarkGfmMod.default ?? remarkGfmMod,
  };
}

async function buildHtml(deps) {
  const mdPath = join(KIT_DIR, 'press-release-pt.md');
  const raw = await readFile(mdPath, 'utf8');
  const { content, data } = deps.matter(raw);
  const processed = await deps.remark().use(deps.remarkGfm).use(deps.remarkHtml).process(content);
  const bodyHtml = processed.toString();
  const title = data.title ?? 'Press release · InovCitrus';

  return `<!DOCTYPE html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <style>${PRINT_CSS}</style>
  </head>
  <body>
    <div class="doc">
      <header class="doc-header">
        <div class="wordmark">
          <span class="frusoal">Frusoal </span>
          <span class="inovcitrus">InovCitrus</span>
        </div>
        <div class="meta">Press release · v1.0 preliminar</div>
      </header>
      <div class="body">${bodyHtml}</div>
      <footer class="doc-footer">
        <span>Frusoal InovCitrus · Tavira · Algarve</span>
        <span>frusoal.pt · inovcitrus.vercel.app</span>
      </footer>
    </div>
  </body>
</html>`;
}

function chromePrintToPdf(htmlPath, pdfPath) {
  return new Promise((res, rej) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--no-margins=false',
      '--print-to-pdf-no-header',
      `--print-to-pdf=${pdfPath}`,
      `file:///${htmlPath.replaceAll('\\', '/')}`,
    ];
    const proc = spawn(CHROME_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', rej);
    proc.on('close', (code) => {
      if (code === 0 && existsSync(pdfPath)) res();
      else rej(new Error(`Chrome exit ${code}; stderr: ${stderr.slice(0, 400)}`));
    });
  });
}

async function main() {
  console.log('[press-release] preparando dirs');
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  console.log('[press-release] carregando deps');
  const deps = await loadDeps();

  console.log('[press-release] construindo HTML');
  const html = await buildHtml(deps);
  const htmlPath = join(TMP_DIR, 'press-release-pt.html');
  const pdfPath = join(OUTPUT_DIR, 'press-release-pt.pdf');
  await writeFile(htmlPath, html, 'utf8');

  console.log('[press-release] Chrome print-to-pdf');
  await chromePrintToPdf(htmlPath, pdfPath);
  console.log(`[press-release] ✓ ${pdfPath}`);

  console.log('[press-release] limpando temp');
  await rm(TMP_DIR, { recursive: true, force: true });
  console.log('[press-release] concluído');
}

main().catch((err) => {
  console.error('[press-release] FAIL:', err);
  process.exitCode = 1;
});
