/**
 * ═══════════════════════════════════════════════════════════════
 *  SOBHA Realty — Registration Team Highlights Generator v1.0
 * ═══════════════════════════════════════════════════════════════
 *
 *  Reads data.json and generates:
 *    - index.html   (4-page version: Cover + Procedures + Awards + Updates)
 *    - onepage.html (1-page condensed dashboard)
 *
 *  Usage:
 *    node gen_highlights.js
 *
 *  Or with portable Node:
 *    Desktop\node-v22.16.0-win-x64\node.exe gen_highlights.js
 * ═══════════════════════════════════════════════════════════════
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8'));

// ── Derived values ──
const totalProc = data.procedures.reduce((s, p) => s + p.count, 0);
const maxProc = Math.max(...data.procedures.map(p => p.count));
const sorted = [...data.procedures].sort((a, b) => b.count - a.count);

// ── Logo ──
const logoFile = path.join(ROOT, 'sobha-realty-logo.webp');
const logoB64 = fs.existsSync(logoFile)
  ? 'data:image/webp;base64,' + fs.readFileSync(logoFile).toString('base64')
  : 'sobha-realty-logo.webp';

// ── Helpers ──
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const pct = (n) => ((n / totalProc) * 100).toFixed(1);
const barW = (n) => ((n / maxProc) * 100).toFixed(1);

// ═══════════════════════════════════════════════════════════════
//  SHARED CSS (brochure-matched palette)
// ═══════════════════════════════════════════════════════════════
const CSS_VARS = `
  :root {
    --sr-black: #000;
    --sr-dark-brown: #5C3D1E;
    --sr-bronze: #85633b;
    --sr-light-bronze: #C5A882;
    --sr-border-bronze: #D4B896;
    --sr-warm-bg: #F5EDE3;
    --sr-card-bg: #FAFAF8;
    --sr-card-border: #D8D0C8;
    --sr-amenity-border: #E8E0D8;
    --sr-label: #555;
    --sr-body-bg: #F0EBE3;
    --sr-muted: #AAA;
    --sr-desc: #444;
    --sr-secondary: #666;
  }`;

const CSS_BASE = `
  @page { size: A4 landscape; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  ${CSS_VARS}
  html { font-size: 10.5pt; }
  body {
    font-family: Tahoma, Geneva, sans-serif;
    color: var(--sr-black);
    background: var(--sr-body-bg);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print { body { background: white; } .page { margin: 0; box-shadow: none; } }`;

// ── Shared components ──
function pgBar() {
  return `<div class="pg-bar">
    <div class="bar-left">
      <span class="bar-section">Highlights</span>
      <div class="bar-divider"></div>
      <span class="bar-sub">${esc(data.team)}</span>
    </div>
    <div class="bar-right">
      <span class="bar-date">${esc(data.month)} ${data.year}</span>
      <div class="bar-divider"></div>
      <div class="bar-logo"><img src="${logoB64}" alt="SOBHA Realty"></div>
    </div>
  </div>`;
}

function secHead(text, tag='h2') {
  return `<div class="sec-head">
    <div class="sec-marker"></div>
    <${tag}>${text}</${tag}>
  </div>`;
}

function pgFooter(pageNum, totalPages) {
  return `<div class="pg-footer">
    <span>SOBHA Realty &bull; ${esc(data.team)} &bull; ${esc(data.department)}</span>
    <span>Page ${pageNum} / ${totalPages}</span>
  </div>`;
}

// ── Cards HTML ──
function cardsHTML(cardClass, numClass) {
  return sorted.map((p, i) => {
    const isTop = i < 2;
    return `<div class="${cardClass}${isTop ? ' top' : ''}">
      <div class="${numClass}">${p.count}</div>
      <div class="cc-label">${esc(p.type)}</div>
      <div class="cc-pct">${pct(p.count)}%</div>
    </div>`;
  }).join('\n        ');
}

function barsHTML(lblClass, fillClass) {
  return sorted.map((p, i) => {
    const alt = i >= 2 ? ' alt' : '';
    return `<div class="h-bar">
      <div class="${lblClass}">${esc(p.type)}</div>
      <div class="hb-track"><div class="${fillClass}${alt}" style="width:${barW(p.count)}%"><span>${p.count}</span></div></div>
    </div>`;
  }).join('\n        ');
}

function awardsHTML_full() {
  const items = data.certificates.map((c, i) => {
    const isLast = i === data.certificates.length - 1 && data.certificates.length > 2;
    return `<div class="aw${isLast ? ' span' : ''}">
      <div class="aw-badge"><div class="aw-dot"></div> ${esc(c.badge)}</div>
      <div class="aw-title">${esc(c.title)}</div>
      <div class="aw-desc">${esc(c.description)}</div>
      <div class="aw-name">${esc(c.recipient)}</div>
    </div>`;
  });
  return items.join('\n        ');
}

function awardsHTML_compact() {
  return data.certificates.map(c =>
    `<div class="aw">
      <div class="aw-badge"><div class="aw-dot"></div> ${esc(c.badge)}</div>
      <div class="aw-title">${esc(c.title)}</div>
      <div class="aw-name">${esc(c.recipient)}</div>
    </div>`
  ).join('\n        ');
}

function updatesHTML(itemClass, txtClass) {
  return data.updates.map(u =>
    `<div class="${itemClass}">
      <div class="u-sq"></div>
      <div class="${txtClass}">${u}</div>
    </div>`
  ).join('\n          ');
}

function progressHTML(sizeClass) {
  return data.inProgress.map(p =>
    `<div class="prog">
      <div class="prog-hd">
        <div class="ph-title">${esc(p.title)}</div>
        <div class="ph-pct">${p.percent}%</div>
      </div>
      <div class="prog-track"><div class="prog-fill" style="width:${p.percent}%"></div></div>
      ${p.note ? `<div class="prog-note">${esc(p.note)}</div>` : ''}
    </div>`
  ).join('\n          ');
}


// ═══════════════════════════════════════════════════════════════
//  GENERATE index.html (4 pages)
// ═══════════════════════════════════════════════════════════════
function genIndex() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Highlights – ${esc(data.month)} ${data.year} — SOBHA Realty ${esc(data.team)}</title>
<style>
  ${CSS_BASE}

  .page {
    width: 297mm; height: 210mm;
    margin: 10mm auto;
    position: relative; overflow: hidden;
    page-break-after: always;
    box-shadow: 0 8px 40px rgba(0,0,0,0.18);
  }

  /* Cover */
  .cover {
    width: 100%; height: 100%;
    background: #fff;
    color: var(--sr-black);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; position: relative;
  }
  .cover-border-top, .cover-border-bottom {
    position: absolute; left: 0; width: 100%; height: 3px;
    background: linear-gradient(90deg, transparent, var(--sr-bronze), var(--sr-light-bronze), var(--sr-bronze), transparent);
  }
  .cover-border-top { top: 0; }
  .cover-border-bottom { bottom: 0; }
  .cover-logo { position: absolute; top: 18mm; right: 24mm; }
  .cover-logo img { height: 38px; }
  .cover-line { height: 1px; background: linear-gradient(90deg, transparent, var(--sr-bronze), transparent); margin: 0 auto; }
  .cover h1 { font-size: 32pt; font-weight: 700; letter-spacing: 5px; text-transform: uppercase; margin-bottom: 5mm; }
  .cover .cover-sub { font-size: 13pt; color: var(--sr-bronze); letter-spacing: 3px; font-weight: 500; margin-bottom: 12mm; }
  .cover-stats { display: grid; grid-template-columns: repeat(4, auto); gap: 4mm 14mm; text-align: center; margin-bottom: 14mm; }
  .cover-stats .cs-label { font-size: 9pt; color: var(--sr-bronze); font-weight: 500; }
  .cover-stats .cs-val { font-size: 9pt; font-weight: 700; }
  .cover-dept { font-size: 9pt; color: var(--sr-bronze); letter-spacing: 1.5px; }
  .cover-info { font-size: 8pt; color: var(--sr-secondary); margin-top: 1.5mm; }
  .cover-conf { font-size: 7pt; color: var(--sr-muted); margin-top: 1.5mm; }

  /* Inner pages */
  .inner { width: 100%; height: 100%; background: #fff; display: flex; flex-direction: column; position: relative; }
  .pg-bar { display: flex; align-items: center; padding: 4mm 8mm 3mm; border-bottom: 0.5px solid var(--sr-light-bronze); }
  .pg-bar .bar-left { flex: 1; display: flex; align-items: center; gap: 10px; }
  .pg-bar .bar-section { font-size: 10pt; color: var(--sr-black); letter-spacing: 1.5px; font-weight: 700; text-transform: uppercase; }
  .pg-bar .bar-divider { width: 1px; height: 24px; background: var(--sr-light-bronze); opacity: 0.6; }
  .pg-bar .bar-sub { font-size: 7.5pt; color: var(--sr-secondary); }
  .pg-bar .bar-right { display: flex; align-items: center; gap: 10px; }
  .pg-bar .bar-date { font-size: 7.5pt; color: var(--sr-secondary); }
  .pg-bar .bar-logo img { height: 22px; }
  .pg-main { flex: 1; padding: 6mm 8mm 4mm; display: flex; flex-direction: column; }
  .pg-footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 2mm 8mm 3mm; border-top: 0.5px solid var(--sr-amenity-border); display: flex; justify-content: space-between; font-size: 5pt; color: var(--sr-muted); letter-spacing: 0.4px; }

  .sec-head { display: flex; align-items: center; gap: 10px; margin-bottom: 5mm; }
  .sec-head .sec-marker { width: 8px; height: 8px; border: 1.5px solid var(--sr-bronze); border-radius: 2px; flex-shrink: 0; }
  .sec-head h2 { font-size: 15pt; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }

  /* Procedures */
  .hero-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 4mm; }
  .hero-row .big { font-size: 48pt; font-weight: 700; color: var(--sr-bronze); line-height: 1; }
  .hero-row .big-lbl { font-size: 10pt; color: var(--sr-secondary); text-transform: uppercase; letter-spacing: 2px; }
  .cards-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin-bottom: 4mm; }
  .c-card { background: #fff; border: 1px solid var(--sr-card-border); border-radius: 4px; padding: 10px 12px; text-align: center; }
  .c-card.top { background: var(--sr-warm-bg); border-color: var(--sr-border-bronze); }
  .c-card .cc-num { font-size: 24pt; font-weight: 700; line-height: 1; margin-bottom: 3px; }
  .c-card.top .cc-num { color: var(--sr-dark-brown); }
  .cc-label { font-size: 7pt; color: var(--sr-label); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.3; }
  .cc-pct { font-size: 6.5pt; color: var(--sr-bronze); margin-top: 2px; font-weight: 500; }
  .h-bars { flex: 1; display: flex; flex-direction: column; gap: 3px; justify-content: center; }
  .h-bar { display: flex; align-items: center; }
  .h-bar .hb-label { width: 130px; font-size: 7.5pt; color: var(--sr-desc); text-align: right; padding-right: 10px; flex-shrink: 0; }
  .hb-track { flex: 1; height: 16px; background: var(--sr-warm-bg); border-radius: 2px; overflow: hidden; }
  .hb-fill { height: 100%; border-radius: 2px; background: var(--sr-bronze); display: flex; align-items: center; justify-content: flex-end; padding-right: 6px; min-width: 24px; }
  .hb-fill.alt { background: var(--sr-light-bronze); }
  .hb-fill span { font-size: 6.5pt; font-weight: 700; color: #fff; }

  /* Awards */
  .awards-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr auto; gap: 3.5mm; }
  .aw { background: #fff; border: 1px solid var(--sr-card-border); border-radius: 4px; padding: 14px 16px; display: flex; flex-direction: column; position: relative; border-left: 3px solid var(--sr-bronze); }
  .aw.span { grid-column: 1 / -1; }
  .aw .aw-badge { font-size: 6.5pt; color: var(--sr-bronze); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .aw .aw-badge .aw-dot { width: 8px; height: 8px; border: 1.5px solid var(--sr-bronze); border-radius: 2px; }
  .aw .aw-title { font-size: 9pt; font-weight: 700; line-height: 1.35; margin-bottom: 4px; }
  .aw .aw-desc { font-size: 7.5pt; color: var(--sr-desc); line-height: 1.4; }
  .aw .aw-name { font-size: 7.5pt; color: var(--sr-secondary); margin-top: auto; padding-top: 6px; }

  /* Updates */
  .updates-grid { flex: 1; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 5mm; }
  .upd-col { display: flex; flex-direction: column; gap: 2.5mm; }
  .upd-col-head { font-size: 7pt; font-weight: 700; color: var(--sr-bronze); text-transform: uppercase; letter-spacing: 1.5px; padding-bottom: 2mm; border-bottom: 1px solid var(--sr-amenity-border); margin-bottom: 1mm; }
  .u-item { display: flex; gap: 8px; align-items: flex-start; padding: 6px 10px; background: var(--sr-card-bg); border: 1px solid var(--sr-card-border); border-radius: 3px; border-left: 3px solid var(--sr-bronze); }
  .u-item .u-sq { width: 6px; height: 6px; border: 1px solid var(--sr-bronze); border-radius: 1px; flex-shrink: 0; margin-top: 3px; }
  .u-item .u-txt { font-size: 7.5pt; color: var(--sr-desc); line-height: 1.4; }
  .u-item .u-txt b { color: var(--sr-black); font-weight: 700; }
  .prog { background: #fff; border: 1px solid var(--sr-card-border); border-radius: 4px; padding: 8px 12px; }
  .prog-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
  .prog-hd .ph-title { font-size: 7.5pt; color: var(--sr-desc); font-weight: 600; line-height: 1.3; max-width: 160px; }
  .prog-hd .ph-pct { font-size: 14pt; font-weight: 700; color: var(--sr-dark-brown); line-height: 1; }
  .prog-track { height: 6px; background: var(--sr-warm-bg); border-radius: 3px; overflow: hidden; }
  .prog-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--sr-bronze), var(--sr-light-bronze)); }
  .prog-note { font-size: 6pt; color: var(--sr-muted); margin-top: 3px; font-style: italic; }
</style>
</head>
<body>

<!-- PAGE 1 — COVER -->
<div class="page">
  <div class="cover">
    <div class="cover-border-top"></div>
    <div class="cover-logo"><img src="${logoB64}" alt="SOBHA Realty"></div>
    <div class="cover-line" style="width:60mm;margin-bottom:12mm;"></div>
    <h1>Highlights</h1>
    <div class="cover-sub">${esc(data.month)} ${data.year}</div>
    <div class="cover-line" style="width:40mm;margin-bottom:12mm;"></div>
    <div class="cover-stats">
      <span class="cs-label">Total Procedures</span>
      <span class="cs-val">${totalProc.toLocaleString()}</span>
      <span class="cs-label">Certificates</span>
      <span class="cs-val">${data.certificates.length}</span>
      <span class="cs-label">Ideas Submitted</span>
      <span class="cs-val">${(sorted.find(p => p.type.toLowerCase().includes('idea')) || {count: 0}).count}</span>
      <span class="cs-label">Key Updates</span>
      <span class="cs-val">${data.updates.length + data.inProgress.length}</span>
    </div>
    <div class="cover-line" style="width:40mm;margin-bottom:10mm;"></div>
    <div class="cover-dept">${esc(data.team)} &bull; ${esc(data.division)}</div>
    <div class="cover-info">${esc(data.department)}</div>
    <div class="cover-conf">Internal Use Only</div>
    <div class="cover-border-bottom"></div>
  </div>
</div>

<!-- PAGE 2 — PROCEDURES -->
<div class="page">
  <div class="inner">
    ${pgBar()}
    <div class="pg-main">
      ${secHead('Number of Procedures Completed')}
      <div class="hero-row">
        <div class="big">${totalProc.toLocaleString()}</div>
        <div class="big-lbl">Total Procedures &bull; ${sorted.length} Categories</div>
      </div>
      <div class="cards-grid">
        ${cardsHTML('c-card', 'cc-num')}
      </div>
      <div class="h-bars">
        ${barsHTML('hb-label', 'hb-fill')}
      </div>
    </div>
    ${pgFooter(2, 4)}
  </div>
</div>

<!-- PAGE 3 — CERTIFICATES & AWARDS -->
<div class="page">
  <div class="inner">
    ${pgBar()}
    <div class="pg-main">
      ${secHead('Certificates &amp; Awards')}
      <div class="awards-grid">
        ${awardsHTML_full()}
      </div>
    </div>
    ${pgFooter(3, 4)}
  </div>
</div>

<!-- PAGE 4 — KEY HIGHLIGHTS & UPDATES -->
<div class="page">
  <div class="inner">
    ${pgBar()}
    <div class="pg-main">
      ${secHead('Other Key Highlights')}
      <div class="updates-grid">
        <div class="upd-col">
          <div class="upd-col-head">Achievements &amp; Updates</div>
          ${updatesHTML('u-item', 'u-txt')}
        </div>
        <div class="upd-col">
          <div class="upd-col-head">In Progress</div>
          ${progressHTML()}
        </div>
      </div>
    </div>
    ${pgFooter(4, 4)}
  </div>
</div>

</body>
</html>`;
}


// ═══════════════════════════════════════════════════════════════
//  GENERATE onepage.html
// ═══════════════════════════════════════════════════════════════
function genOnepage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Highlights – ${esc(data.month)} ${data.year} — SOBHA Realty (One Page)</title>
<style>
  ${CSS_BASE}

  .page {
    width: 297mm; height: 210mm;
    margin: 10mm auto;
    background: #fff;
    position: relative; overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,0.18);
    display: flex; flex-direction: column;
  }

  .pg-bar { display: flex; align-items: center; padding: 4mm 8mm 3mm; border-bottom: 0.5px solid var(--sr-light-bronze); flex-shrink: 0; }
  .pg-bar .bar-left { flex: 1; display: flex; align-items: center; gap: 10px; }
  .pg-bar .bar-section { font-size: 10pt; color: var(--sr-black); letter-spacing: 1.5px; font-weight: 700; text-transform: uppercase; }
  .pg-bar .bar-divider { width: 1px; height: 24px; background: var(--sr-light-bronze); opacity: 0.6; }
  .pg-bar .bar-sub { font-size: 7.5pt; color: var(--sr-secondary); }
  .pg-bar .bar-right { display: flex; align-items: center; gap: 10px; }
  .pg-bar .bar-date { font-size: 7.5pt; color: var(--sr-secondary); }
  .pg-bar .bar-logo img { height: 22px; }

  .body-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; padding: 4mm 6mm 2mm; overflow: hidden; }
  .col { display: flex; flex-direction: column; padding: 0 4mm; }
  .col:first-child { padding-left: 0; }
  .col:last-child { padding-right: 0; }
  .col:not(:last-child) { border-right: 0.5px solid var(--sr-amenity-border); }

  .sec-head { display: flex; align-items: center; gap: 6px; margin-bottom: 3mm; }
  .sec-head .sec-marker { width: 7px; height: 7px; border: 1.5px solid var(--sr-bronze); border-radius: 2px; flex-shrink: 0; }
  .sec-head h3 { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }

  .hero-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2.5mm; }
  .hero-row .big { font-size: 36pt; font-weight: 700; color: var(--sr-bronze); line-height: 1; }
  .hero-row .big-lbl { font-size: 7pt; color: var(--sr-secondary); text-transform: uppercase; letter-spacing: 1px; }

  .cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; margin-bottom: 2.5mm; }
  .c-card { background: #fff; border: 1px solid var(--sr-card-border); border-radius: 4px; padding: 5px 7px; text-align: center; }
  .c-card.top { background: var(--sr-warm-bg); border-color: var(--sr-border-bronze); }
  .c-card .cc-num { font-size: 15pt; font-weight: 700; line-height: 1; }
  .c-card.top .cc-num { color: var(--sr-dark-brown); }
  .cc-label { font-size: 5.5pt; color: var(--sr-label); font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.2; margin-top: 1px; }

  .h-bars { flex: 1; display: flex; flex-direction: column; gap: 2px; justify-content: center; }
  .h-bar { display: flex; align-items: center; }
  .h-bar .hb-label { width: 90px; font-size: 6pt; color: var(--sr-desc); text-align: right; padding-right: 6px; flex-shrink: 0; }
  .hb-track { flex: 1; height: 11px; background: var(--sr-warm-bg); border-radius: 2px; overflow: hidden; }
  .hb-fill { height: 100%; border-radius: 2px; background: var(--sr-bronze); display: flex; align-items: center; justify-content: flex-end; padding-right: 4px; min-width: 18px; }
  .hb-fill.alt { background: var(--sr-light-bronze); }
  .hb-fill span { font-size: 5pt; font-weight: 700; color: #fff; }

  .aw-list { display: flex; flex-direction: column; gap: 1.5mm; }
  .aw { background: #fff; border: 1px solid var(--sr-card-border); border-radius: 4px; padding: 5px 8px; border-left: 3px solid var(--sr-bronze); }
  .aw .aw-badge { font-size: 5pt; color: var(--sr-bronze); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 2px; display: flex; align-items: center; gap: 4px; }
  .aw .aw-badge .aw-dot { width: 5px; height: 5px; border: 1px solid var(--sr-bronze); border-radius: 1px; }
  .aw .aw-title { font-size: 6.5pt; font-weight: 700; line-height: 1.3; }
  .aw .aw-name { font-size: 5.5pt; color: var(--sr-secondary); margin-top: 1px; }

  .sub-divider { margin: 2.5mm 0 2mm; border: none; border-top: 0.5px solid var(--sr-amenity-border); }

  .prog-list { display: flex; flex-direction: column; gap: 2mm; }
  .prog { background: #fff; border: 1px solid var(--sr-card-border); border-radius: 4px; padding: 6px 8px; }
  .prog-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .prog-hd .ph-title { font-size: 6.5pt; color: var(--sr-desc); font-weight: 600; line-height: 1.3; max-width: 130px; }
  .prog-hd .ph-pct { font-size: 12pt; font-weight: 700; color: var(--sr-dark-brown); line-height: 1; }
  .prog-track { height: 5px; background: var(--sr-warm-bg); border-radius: 3px; overflow: hidden; }
  .prog-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--sr-bronze), var(--sr-light-bronze)); }
  .prog-note { font-size: 5pt; color: var(--sr-muted); margin-top: 2px; font-style: italic; }

  .u-list { display: flex; flex-direction: column; gap: 1.5mm; }
  .u-item { display: flex; gap: 5px; align-items: flex-start; padding: 4px 7px; background: var(--sr-card-bg); border: 1px solid var(--sr-card-border); border-radius: 3px; border-left: 3px solid var(--sr-bronze); }
  .u-item .u-sq { width: 5px; height: 5px; border: 1px solid var(--sr-bronze); border-radius: 1px; flex-shrink: 0; margin-top: 2px; }
  .u-item .u-txt { font-size: 6pt; color: var(--sr-desc); line-height: 1.35; }
  .u-item .u-txt b { color: var(--sr-black); font-weight: 700; }

  .pg-footer { flex-shrink: 0; padding: 2mm 8mm 3mm; border-top: 0.5px solid var(--sr-amenity-border); display: flex; justify-content: space-between; font-size: 5pt; color: var(--sr-muted); letter-spacing: 0.4px; }
</style>
</head>
<body>

<div class="page">
  ${pgBar()}

  <div class="body-grid">
    <!-- Column 1: Procedures -->
    <div class="col">
      ${secHead('Number of Procedures Completed', 'h3')}
      <div class="hero-row">
        <div class="big">${totalProc.toLocaleString()}</div>
        <div class="big-lbl">Total<br>Procedures</div>
      </div>
      <div class="cards-grid">
        ${sorted.map((p, i) => `<div class="c-card${i < 2 ? ' top' : ''}">
          <div class="cc-num">${p.count}</div>
          <div class="cc-label">${esc(p.type)}</div>
        </div>`).join('\n        ')}
      </div>
      <div class="h-bars">
        ${barsHTML('hb-label', 'hb-fill')}
      </div>
    </div>

    <!-- Column 2: Awards + Progress -->
    <div class="col">
      ${secHead('Certificates &amp; Awards', 'h3')}
      <div class="aw-list">
        ${awardsHTML_compact()}
      </div>
      <hr class="sub-divider">
      ${secHead('In Progress', 'h3')}
      <div class="prog-list">
        ${progressHTML()}
      </div>
    </div>

    <!-- Column 3: Updates -->
    <div class="col">
      ${secHead('Other Key Highlights', 'h3')}
      <div class="u-list">
        ${updatesHTML('u-item', 'u-txt')}
      </div>
    </div>
  </div>

  <div class="pg-footer">
    <span>SOBHA Realty &bull; ${esc(data.team)} &bull; ${esc(data.department)}</span>
    <span>Highlights &mdash; ${esc(data.month)} ${data.year}</span>
  </div>
</div>

</body>
</html>`;
}


// ═══════════════════════════════════════════════════════════════
//  INSTRUCTIONS FILE
// ═══════════════════════════════════════════════════════════════
function genInstructions() {
  return `═══════════════════════════════════════════════════════════════
 SOBHA Realty — Registration Team Highlights
 Monthly Report Generator — Instructions
═══════════════════════════════════════════════════════════════


 1. WHAT THIS IS
 ───────────────
 A tool that generates the monthly "Highlights" report for the
 Registrations Team. You fill in data.json, run the generator,
 and it produces two ready-to-print HTML reports.


 2. FILES
 ────────
 HIGHLIGHTS/
 ├── data.json              ← EDIT THIS each month
 ├── gen_highlights.js      ← Generator script (do not edit)
 ├── sobha-realty-logo.webp ← Sobha logo (do not remove)
 ├── index.html             ← OUTPUT: 4-page report
 └── onepage.html           ← OUTPUT: 1-page dashboard


 3. HOW TO UPDATE MONTHLY
 ────────────────────────

 Step 1 — Open data.json in any text editor (Notepad, VS Code)

 Step 2 — Update these fields:

   "month": "March",        ← Change to current month
   "year": 2026,            ← Change if needed

 Step 3 — Update procedures (add, remove, or change counts):

   "procedures": [
     { "type": "SPA Registration (UAQ)", "count": 200 },
     { "type": "Pre-registration",       "count": 150 },
     ...add or remove lines as needed...
   ]

 Step 4 — Update certificates (add new, remove old):

   "certificates": [
     {
       "badge": "Certificate of Recognition",
       "title": "The achievement title here",
       "description": "Brief description of what was achieved.",
       "recipient": "Full Name"
     },
     ...add more...
   ]

 Step 5 — Update completed items (use <b>bold</b> for emphasis):

   "updates": [
     "Achieved <b>100% target</b> for the month.",
     "Completed <b>new process</b> implementation.",
     ...
   ]

 Step 6 — Update in-progress items:

   "inProgress": [
     { "title": "Project Name", "percent": 75 },
     { "title": "Another Project", "percent": 40, "note": "Optional note" }
   ]

 Step 7 — Save data.json

 Step 8 — Run the generator:

   Desktop\\node-v22.16.0-win-x64\\node.exe gen_highlights.js

   Or if Node is in PATH:

   node gen_highlights.js

 Step 9 — Open index.html or onepage.html in browser
          Print to PDF via Ctrl+P → Save as PDF


 4. FORMATTING TIPS
 ──────────────────
 • Use <b>text</b> in updates[] to make words bold
 • Use — (em dash) for separators in text
 • Procedure types are auto-sorted by count (highest first)
 • Top 2 procedures get highlighted cards automatically
 • Percentages are calculated automatically
 • Bar widths scale to the largest value automatically


 5. PRINTING TO PDF
 ──────────────────
 1. Open the HTML file in Chrome or Edge
 2. Press Ctrl+P
 3. Set "Destination" to "Save as PDF"
 4. Set "Layout" to "Landscape"
 5. Set "Margins" to "None"
 6. Enable "Background graphics"
 7. Click "Save"


 6. TROUBLESHOOTING
 ──────────────────
 • "Cannot find module" → Make sure you run the command from
   the HIGHLIGHTS folder
 • Logo missing → Ensure sobha-realty-logo.webp is in the folder
 • JSON error → Check data.json for missing commas, brackets
   Tip: paste it into jsonlint.com to validate
 • Bars look wrong → Check that all count values are numbers,
   not strings (use 100 not "100")


═══════════════════════════════════════════════════════════════
 Prepared by: Ali Sultan Rashed Khalifa Alghumlasi
 Department:  Executive Registrations | Registration / DLD
 Version:     1.0 — March 2026
═══════════════════════════════════════════════════════════════
`;
}


// ── Write all files ──
const indexPath = path.join(ROOT, 'index.html');
const onepagePath = path.join(ROOT, 'onepage.html');
const instrPath = path.join(ROOT, 'INSTRUCTIONS.txt');

fs.writeFileSync(indexPath, genIndex(), 'utf8');
fs.writeFileSync(onepagePath, genOnepage(), 'utf8');
fs.writeFileSync(instrPath, genInstructions(), 'utf8');

console.log('');
console.log('  ╔══════════════════════════════════════════════════╗');
console.log('  ║  SOBHA Realty — Highlights Generator v1.0       ║');
console.log('  ╠══════════════════════════════════════════════════╣');
console.log(`  ║  Month:        ${data.month} ${data.year}                    ║`);
console.log(`  ║  Procedures:   ${totalProc} total (${sorted.length} types)              ║`);
console.log(`  ║  Certificates: ${data.certificates.length}                              ║`);
console.log(`  ║  Updates:      ${data.updates.length} completed + ${data.inProgress.length} in progress       ║`);
console.log('  ╠══════════════════════════════════════════════════╣');
console.log(`  ║  → ${path.basename(indexPath)}    (4-page report)            ║`);
console.log(`  ║  → ${path.basename(onepagePath)}  (1-page dashboard)         ║`);
console.log(`  ║  → ${path.basename(instrPath)}   (instructions)     ║`);
console.log('  ╚══════════════════════════════════════════════════╝');
console.log('');
