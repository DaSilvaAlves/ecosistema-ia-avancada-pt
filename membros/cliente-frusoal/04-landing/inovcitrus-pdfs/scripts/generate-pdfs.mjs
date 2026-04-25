#!/usr/bin/env node
/**
 * Standalone PDF generator for InovCitrus ficha-tecnica.
 * Reads 4 markdown files (PT/EN/ES/FR), converts to A4-styled HTML,
 * then drives system Chrome via --headless --print-to-pdf.
 *
 * Run from `04-landing/inovcitrus-pdfs/`:
 *   node scripts/generate-pdfs.mjs
 *
 * No external runtime deps beyond what's already in inovcitrus-site/node_modules
 * (gray-matter, remark, remark-gfm, remark-html). Uses absolute path to that
 * node_modules so this script can live in inovcitrus-pdfs/ but reuse deps.
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PDF_ROOT = resolve(__dirname, '..');                              // inovcitrus-pdfs/
const SITE_ROOT = resolve(PDF_ROOT, '..', 'inovcitrus-site');           // inovcitrus-site/
const SOURCE_DIR = resolve(PDF_ROOT, 'source');                         // inovcitrus-pdfs/source/
const OUTPUT_DIR = resolve(PDF_ROOT, 'output');                         // inovcitrus-pdfs/output/
const TMP_DIR = resolve(PDF_ROOT, '.tmp-html');                         // inovcitrus-pdfs/.tmp-html/

const LOCALES = ['pt', 'en', 'es', 'fr'];

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PRINT_CSS = `
@page { size: A4; margin: 18mm 16mm 20mm 16mm; }
@media print { html, body { background: #ffffff !important; } }
* { box-sizing: border-box; }
html, body { background: #ffffff; color: #1A1A1A; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10.5pt; line-height: 1.55; margin: 0; padding: 0; }
.doc { max-width: 178mm; margin: 0 auto; padding: 0; }
h1 { font-size: 22pt; font-weight: 800; color: #1A1A1A; letter-spacing: -0.01em; margin: 0 0 6pt 0; }
h2 { font-size: 14pt; font-weight: 700; color: #1A1A1A; margin: 18pt 0 6pt 0; padding-bottom: 4pt; border-bottom: 1px solid #E5E2DA; }
h3 { font-size: 12pt; font-weight: 700; color: #1A1A1A; margin: 12pt 0 4pt 0; }
p { margin: 6pt 0; color: #3A3A3A; }
strong { color: #1A1A1A; font-weight: 700; }
em { color: #3A3A3A; }
a { color: #C68420; text-decoration: none; }
ul, ol { margin: 4pt 0 4pt 18pt; padding: 0; color: #3A3A3A; }
li { margin: 2pt 0; }
blockquote { border-left: 3pt solid #E8A53C; background: #FAF8F4; margin: 8pt 0; padding: 6pt 10pt; color: #3A3A3A; }
blockquote p { margin: 2pt 0; }
hr { border: none; border-top: 1px solid #E5E2DA; margin: 12pt 0; }
table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 9.5pt; page-break-inside: avoid; }
th { background: #FAF8F4; color: #1A1A1A; font-weight: 700; text-align: left; border: 1px solid #E5E2DA; padding: 5pt 7pt; }
td { border: 1px solid #E5E2DA; padding: 5pt 7pt; vertical-align: top; color: #3A3A3A; }
code { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 9.5pt; color: #C68420; background: #FAF8F4; padding: 1pt 4pt; border-radius: 2pt; }
.doc-header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 6pt; border-bottom: 2pt solid #E8A53C; margin-bottom: 14pt; }
.doc-header .wordmark { font-size: 11pt; }
.doc-header .wordmark .frusoal { font-weight: 400; }
.doc-header .wordmark .inovcitrus { font-weight: 800; }
.doc-header .meta { font-size: 8pt; color: #6B6B6B; letter-spacing: 0.04em; text-transform: uppercase; }
.doc-footer { margin-top: 16pt; padding-top: 6pt; border-top: 1pt solid #E5E2DA; font-size: 8pt; color: #6B6B6B; display: flex; justify-content: space-between; }
.body :first-child { margin-top: 0; }
h2 + table, h2 + p, h2 + ul { page-break-before: avoid; }
`;

const HEADER_META_BY_LOCALE = {
  pt: 'Ficha técnica · v1.0 preliminar',
  en: 'Technical fact sheet · v1.0 preliminary',
  es: 'Ficha técnica · v1.0 preliminar',
  fr: 'Fiche technique · v1.0 préliminaire',
};

const stripSourceComments = (markdown) =>
  markdown.replace(/<!--\s*F\d+(?:[^>]*)-->/g, '');

async function loadDeps() {
  // Reuse inovcitrus-site/node_modules without cwd hops by importing absolute paths.
  const matterMod = await import(`file:///${SITE_ROOT.replaceAll('\\', '/')}/node_modules/gray-matter/index.js`);
  const remarkMod = await import(`file:///${SITE_ROOT.replaceAll('\\', '/')}/node_modules/remark/index.js`);
  const remarkHtmlMod = await import(`file:///${SITE_ROOT.replaceAll('\\', '/')}/node_modules/remark-html/index.js`);
  const remarkGfmMod = await import(`file:///${SITE_ROOT.replaceAll('\\', '/')}/node_modules/remark-gfm/index.js`);
  return {
    matter: matterMod.default ?? matterMod,
    remark: remarkMod.remark ?? (remarkMod.default && remarkMod.default.remark) ?? remarkMod.default,
    remarkHtml: remarkHtmlMod.default ?? remarkHtmlMod,
    remarkGfm: remarkGfmMod.default ?? remarkGfmMod,
  };
}

async function buildHtml(lang, deps) {
  const mdPath = join(SOURCE_DIR, lang, `ficha-tecnica-scirtothrips-${lang}.md`);
  const raw = await readFile(mdPath, 'utf8');
  const { content, data } = deps.matter(raw);
  const cleaned = stripSourceComments(content);
  const processed = await deps.remark().use(deps.remarkGfm).use(deps.remarkHtml).process(cleaned);
  const bodyHtml = processed.toString();
  const title = data.title ?? `Ficha técnica · ${lang.toUpperCase()}`;
  const meta = HEADER_META_BY_LOCALE[lang] ?? HEADER_META_BY_LOCALE.pt;

  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <style>${PRINT_CSS}</style>
  </head>
  <body>
    <div class="doc">
      <header class="doc-header">
        <div class="wordmark">
          <span class="frusoal">Frusoal </span>
          <span class="inovcitrus">InovCitrus</span>
        </div>
        <div class="meta">${escapeHtml(meta)}</div>
      </header>
      <div class="body">${bodyHtml}</div>
      <footer class="doc-footer">
        <span>Frusoal InovCitrus · Tavira · Algarve</span>
        <span>frusoal.pt</span>
      </footer>
    </div>
  </body>
</html>`;
}

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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
  console.log('[pdfs] preparando dirs');
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  console.log('[pdfs] carregando deps');
  const deps = await loadDeps();

  for (const lang of LOCALES) {
    console.log(`[pdfs] processando ${lang}`);
    const html = await buildHtml(lang, deps);
    const htmlPath = join(TMP_DIR, `ficha-tecnica-${lang}.html`);
    const pdfPath = join(OUTPUT_DIR, `ficha-tecnica-scirtothrips-${lang}.pdf`);
    await writeFile(htmlPath, html, 'utf8');
    await chromePrintToPdf(htmlPath, pdfPath);
    console.log(`[pdfs] ✓ ${pdfPath}`);
  }

  console.log('[pdfs] limpando temp');
  await rm(TMP_DIR, { recursive: true, force: true });
  console.log('[pdfs] concluído — 4 PDFs em', OUTPUT_DIR);
}

main().catch((err) => {
  console.error('[pdfs] FAIL:', err);
  process.exitCode = 1;
});
