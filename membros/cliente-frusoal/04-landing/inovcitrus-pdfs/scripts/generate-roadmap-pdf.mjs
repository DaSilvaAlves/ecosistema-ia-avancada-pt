#!/usr/bin/env node
/**
 * Roadmap PDF generator — InovCitrus 36 meses (2026-2028).
 * Reads roadmap/roadmap-data.json, builds 1-page A4 landscape HTML,
 * drives system Chrome via --headless --print-to-pdf.
 *
 * Run from `04-landing/inovcitrus-pdfs/`:
 *   node scripts/generate-roadmap-pdf.mjs
 *
 * Zero new dependencies. Reuses Chrome already installed.
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PDF_ROOT = resolve(__dirname, '..');
const ROADMAP_JSON = resolve(PDF_ROOT, 'roadmap', 'roadmap-data.json');
const OUTPUT_DIR = resolve(PDF_ROOT, 'output');
const TMP_DIR = resolve(PDF_ROOT, '.tmp-html');

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const TRACK_META = {
  scientific:    { color: '#5A8C45', label: 'Marcos científicos',  symbol: '●' },
  operational:   { color: '#6B6B6B', label: 'Operações de campo',  symbol: '◆' },
  communication: { color: '#C68420', label: 'Actos comunicativos', symbol: '▲' },
};

const COMM_LABEL = {
  press_release:                       'Press release',
  artigo_postal_algarve:               'Artigo Postal do Algarve',
  ficha_metodologica_produtores:       'Ficha metodológica · produtores',
  post_linkedin_pedro_madeira:         'Post LinkedIn · Pedro Madeira',
  comunicacao_blog_frusoal:            'Comunicação blog Frusoal',
  infografico_associados:              'Infográfico · associados',
  primeira_ficha_tecnica_produtores:   '1.ª ficha técnica · produtores',
  comunicacao_multilingue_publica:     'Comunicação multilingue pública',
  segunda_ficha_tecnica_produtores:    '2.ª ficha técnica · produtores',
  publicacao_cientifica_interim:       'Publicação científica interim',
  infografico_produtores:              'Infográfico · produtores',
  ficha_tecnica_consolidada_produtores:'Ficha técnica consolidada',
  publicacao_cientifica_final:         'Publicação científica final',
  evento_sectorial_apresentacao:       'Evento sectorial',
  press_release_conclusao:             'Press release conclusão',
  relatorio_final_publico:             'Relatório final público',
};

const STATUS_LABEL = {
  executado: 'executado',
  previsto:  'previsto',
};

const PRINT_CSS = `
@page { size: A4 landscape; margin: 10mm 12mm; }
@media print { html, body { background: #ffffff !important; } }
* { box-sizing: border-box; }
html, body { background: #ffffff; color: #1A1A1A; font-family: 'Inter', -apple-system, sans-serif; font-size: 8.8pt; line-height: 1.35; margin: 0; padding: 0; }
.doc { display: flex; flex-direction: column; height: calc(210mm - 20mm); }

.doc-header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 5pt; border-bottom: 1.5pt solid #E8A53C; margin-bottom: 8pt; }
.doc-header .wordmark { font-size: 12pt; }
.doc-header .wordmark .frusoal { font-weight: 400; }
.doc-header .wordmark .inovcitrus { font-weight: 800; }
.doc-header .meta { font-size: 7.5pt; color: #6B6B6B; letter-spacing: 0.06em; text-transform: uppercase; }

h1 { font-size: 14pt; font-weight: 800; margin: 0 0 2pt 0; color: #1A1A1A; }
.subtitle { font-size: 9pt; color: #3A3A3A; margin: 0 0 8pt 0; font-style: italic; }

.timeline { flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; min-height: 0; }
.year { display: flex; flex-direction: column; border: 1pt solid #E5E2DA; border-radius: 3pt; overflow: hidden; }
.year-head { background: #FAF8F4; padding: 4pt 6pt; border-bottom: 1pt solid #E5E2DA; display: flex; justify-content: space-between; align-items: baseline; }
.year-head .y { font-size: 13pt; font-weight: 800; color: #1A1A1A; letter-spacing: -0.01em; }
.year-head .quarters { font-size: 7pt; color: #6B6B6B; letter-spacing: 0.08em; }

.band { padding: 5pt 6pt; }
.band-science { background: rgba(90, 140, 69, 0.04); border-bottom: 1pt solid #E5E2DA; }
.band-comm    { background: rgba(232, 165, 60, 0.04); }
.band-title { font-size: 6.8pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #6B6B6B; margin: 0 0 4pt 0; }

.ms { display: grid; grid-template-columns: 14pt 22pt 1fr; gap: 3pt; align-items: start; margin: 2pt 0; padding: 2pt 0; }
.ms-dot { font-size: 10pt; line-height: 1; padding-top: 1pt; }
.ms-q { font-size: 7pt; font-weight: 700; color: #6B6B6B; padding-top: 2pt; letter-spacing: 0.04em; }
.ms-content .ms-title { font-size: 8.4pt; font-weight: 700; color: #1A1A1A; margin: 0 0 1pt 0; line-height: 1.3; }
.ms-content .ms-desc { font-size: 7.4pt; color: #3A3A3A; line-height: 1.35; margin: 0; }

.comm-list { list-style: none; padding: 0; margin: 0; }
.comm-item { display: grid; grid-template-columns: 22pt 1fr; gap: 3pt; font-size: 7.6pt; padding: 1.2pt 0; border-bottom: 1pt dotted #EDE7DC; }
.comm-item:last-child { border-bottom: 0; }
.comm-q { font-weight: 700; color: #6B6B6B; letter-spacing: 0.04em; }
.comm-text { color: #3A3A3A; }
.comm-text .lang { color: #C68420; font-weight: 600; font-size: 6.6pt; letter-spacing: 0.06em; margin-left: 3pt; text-transform: uppercase; }
.comm-text .status-exec { color: #5A8C45; font-weight: 700; font-size: 6.6pt; letter-spacing: 0.04em; margin-left: 3pt; text-transform: uppercase; }

.legend { display: flex; gap: 14pt; font-size: 7.4pt; color: #3A3A3A; margin: 6pt 0 4pt 0; align-items: center; }
.legend-item { display: flex; align-items: center; gap: 4pt; }
.legend-symbol { font-size: 9.5pt; line-height: 1; }
.legend-sci { color: #5A8C45; }
.legend-op  { color: #6B6B6B; }
.legend-com { color: #C68420; }

.disclaimer { font-size: 7pt; color: #6B6B6B; margin: 0; font-style: italic; line-height: 1.4; }

.doc-footer { margin-top: 6pt; padding-top: 4pt; border-top: 1pt solid #E5E2DA; font-size: 6.8pt; color: #6B6B6B; display: flex; justify-content: space-between; letter-spacing: 0.04em; }
`;

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function quarterShort(quarter) {
  // "2026-Q1" -> "Q1"
  const m = /Q(\d)/.exec(quarter);
  return m ? `Q${m[1]}` : quarter;
}

function yearOf(quarter) {
  return Number(String(quarter).slice(0, 4));
}

function groupByYear(milestones) {
  const years = { 2026: [], 2027: [], 2028: [] };
  for (const ms of milestones) {
    const y = yearOf(ms.quarter);
    if (years[y]) years[y].push(ms);
  }
  for (const y of Object.keys(years)) {
    years[y].sort((a, b) => a.month - b.month);
  }
  return years;
}

function renderMilestone(ms) {
  const t = TRACK_META[ms.track] || TRACK_META.scientific;
  const dotStyle = `color:${t.color};`;
  const q = quarterShort(ms.quarter);
  return `
    <div class="ms">
      <div class="ms-dot" style="${dotStyle}">${t.symbol}</div>
      <div class="ms-q">${q}</div>
      <div class="ms-content">
        <p class="ms-title">${escapeHtml(ms.title)}</p>
        <p class="ms-desc">${escapeHtml(ms.description)}</p>
      </div>
    </div>`;
}

function renderCommItem(act, quarter) {
  const label = COMM_LABEL[act.type] || act.type.replaceAll('_', ' ');
  const langs = Array.isArray(act.lang) ? act.lang.join('/').toUpperCase() : '';
  const isExec = act.status === 'executado';
  const ref = act.ref ? ` · ${act.ref}` : '';
  return `
    <li class="comm-item">
      <span class="comm-q">${quarterShort(quarter)}</span>
      <span class="comm-text">${escapeHtml(label)}${ref}<span class="lang">${langs}</span>${isExec ? '<span class="status-exec">executado</span>' : ''}</span>
    </li>`;
}

function renderYearColumn(year, milestones) {
  const science = milestones.filter((m) => m.track === 'scientific' || m.track === 'operational');
  // Aggregate communication acts (with quarter context)
  const commActs = [];
  for (const m of milestones) {
    for (const act of (m.communication_acts || [])) {
      commActs.push({ ...act, quarter: m.quarter, month: m.month });
    }
  }
  commActs.sort((a, b) => a.month - b.month);

  const sciHtml = science.length
    ? science.map(renderMilestone).join('')
    : '<p class="ms-desc" style="color:#9B9B9B;">—</p>';

  const commHtml = commActs.length
    ? commActs.map((a) => renderCommItem(a, a.quarter)).join('')
    : '<li class="comm-item"><span class="comm-text" style="color:#9B9B9B;">—</span></li>';

  return `
    <div class="year">
      <div class="year-head">
        <span class="y">${year}</span>
        <span class="quarters">Q1 · Q2 · Q3 · Q4</span>
      </div>
      <div class="band band-science">
        <h3 class="band-title">Marcos · Operações</h3>
        ${sciHtml}
      </div>
      <div class="band band-comm">
        <h3 class="band-title">Actos comunicativos · ${commActs.length}</h3>
        <ul class="comm-list">${commHtml}</ul>
      </div>
    </div>`;
}

async function buildHtml() {
  const raw = await readFile(ROADMAP_JSON, 'utf8');
  const data = JSON.parse(raw);
  const years = groupByYear(data.milestones || []);

  const cols = [2026, 2027, 2028]
    .map((y) => renderYearColumn(y, years[y]))
    .join('\n');

  const totalActs = data.communication_inventory?.total_actos_comunicativos ?? '';
  const meta = `Roadmap 36 meses · ${data.version || 'v1.0'} · ${data.date || ''}`;

  return `<!DOCTYPE html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(data.title)}</title>
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
        <div class="meta">${escapeHtml(meta)}</div>
      </header>

      <h1>Calendário do Projecto Trienal — 2026 · 2027 · 2028</h1>
      <p class="subtitle">${escapeHtml(data.subtitle || '')}</p>

      <div class="timeline">
        ${cols}
      </div>

      <div class="legend">
        <div class="legend-item"><span class="legend-symbol legend-sci">●</span>Marcos científicos</div>
        <div class="legend-item"><span class="legend-symbol legend-op">◆</span>Operações de campo</div>
        <div class="legend-item"><span class="legend-symbol legend-com">▲</span>Actos comunicativos · ${totalActs} no total</div>
      </div>

      <p class="disclaimer">${escapeHtml(data.disclaimer || '')}</p>

      <footer class="doc-footer">
        <span>Frusoal InovCitrus · Tavira · Algarve · Portugal</span>
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
  console.log('[roadmap] preparando dirs');
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  console.log('[roadmap] construindo HTML');
  const html = await buildHtml();
  const htmlPath = join(TMP_DIR, 'roadmap-36-meses.html');
  const pdfPath = join(OUTPUT_DIR, 'roadmap-36-meses.pdf');
  await writeFile(htmlPath, html, 'utf8');

  console.log('[roadmap] Chrome print-to-pdf');
  await chromePrintToPdf(htmlPath, pdfPath);
  console.log(`[roadmap] ✓ ${pdfPath}`);

  console.log('[roadmap] limpando temp');
  await rm(TMP_DIR, { recursive: true, force: true });
  console.log('[roadmap] concluído');
}

main().catch((err) => {
  console.error('[roadmap] FAIL:', err);
  process.exitCode = 1;
});
