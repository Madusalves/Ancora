import { formatBRL, formatDecimal } from '@/features/transactions/format';

import { formatPercent, formatPercentDelta, SAVINGS_GOAL, type Analysis, type Period } from './analysis';
import { FLOW_EXPENSE, FLOW_INCOME, SLICE_COLORS } from './palette';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const kpi = (label: string, value: string, sub = '', color = '#191c1e') =>
  `<div class="kpi"><span>${label}</span><b style="color:${color}">${value}</b><i>${sub || '&nbsp;'}</i></div>`;

/** Rosca de distribuição em SVG (mesma lógica do gráfico do app). */
function donutSvg(shares: number[]) {
  const size = 170;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arcs = shares
    .map((sh, i) => {
      const offset = shares.slice(0, i).reduce((acc, v) => acc + v, 0) * c;
      return `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${SLICE_COLORS[i % SLICE_COLORS.length]}" stroke-width="${stroke}" stroke-dasharray="${Math.max(sh * c - 2, 0)} ${c}" stroke-dashoffset="${-offset}"/>`;
    })
    .join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="rotate(-90 ${size / 2} ${size / 2})"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#eceef0" stroke-width="${stroke}"/>${arcs}</g>
    <text x="50%" y="${size / 2 + 2}" text-anchor="middle" font-size="26" font-weight="700" fill="#191c1e">100%</text>
    <text x="50%" y="${size / 2 + 18}" text-anchor="middle" font-size="9" letter-spacing="1" fill="#6d7a72">SAÍDAS</text>
  </svg>`;
}

/** Barras agrupadas (entradas × saídas) dos últimos 4 meses em SVG. */
function flowSvg(items: Analysis['cashFlow']) {
  const w = 540;
  const h = 190;
  const base = 160;
  const area = 130;
  const barW = 30;
  const max = Math.max(1, ...items.flatMap((i) => [i.income, i.expense]));
  const hh = (v: number) => (v > 0 ? Math.max(3, (v / max) * area) : 0);
  const step = w / items.length;
  const bars = items
    .map((it, idx) => {
      const cx = step * idx + step / 2;
      const hi = hh(it.income);
      const he = hh(it.expense);
      const last = idx === items.length - 1;
      return `<rect x="${cx - barW - 2}" y="${base - hi}" width="${barW}" height="${hi}" rx="3" fill="${FLOW_INCOME}"/>
        <rect x="${cx + 2}" y="${base - he}" width="${barW}" height="${he}" rx="3" fill="${FLOW_EXPENSE}"/>
        <text x="${cx}" y="${base + 20}" text-anchor="middle" font-size="12" font-weight="${last ? 700 : 400}" fill="${last ? '#191c1e' : '#6d7a72'}">${it.label}</text>`;
    })
    .join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><line x1="0" y1="${base}" x2="${w}" y2="${base}" stroke="#e0e3e5"/>${bars}</svg>`;
}

export function buildReportHtml(period: Period, a: Analysis): string {
  const last = a.cashFlow[a.cashFlow.length - 1];
  const monthNet = last.income - last.expense;
  const money = (v: number) => `${v < 0 ? '-' : '+'}R$ ${formatDecimal(Math.abs(v))}`;
  const delta =
    a.dailyDelta === null ? '' : `${formatPercentDelta(a.dailyDelta)} vs. período anterior`;
  const deltaColor = a.dailyDelta !== null && a.dailyDelta > 0 ? '#ba1a1a' : '#006948';

  const legend = a.slices
    .map(
      (s, i) =>
        `<tr><td><span class="dot" style="background:${SLICE_COLORS[i % SLICE_COLORS.length]}"></span>${esc(s.name)}</td><td class="r">${formatBRL(s.amount)}</td><td class="r"><b>${Math.round(s.share * 100)}%</b></td></tr>`,
    )
    .join('');
  const flow = a.cashFlow
    .map(
      (m) =>
        `<tr><td>${m.label}</td><td class="r">${formatBRL(m.income)}</td><td class="r">${formatBRL(m.expense)}</td><td class="r">${money(m.income - m.expense)}</td></tr>`,
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    *{box-sizing:border-box}
    body{font-family:Helvetica,Arial,sans-serif;color:#191c1e;padding:24px;margin:0}
    .eyebrow{font-size:10px;letter-spacing:1px;color:#6d7a72;margin:0}
    h1{color:#006948;margin:2px 0 4px;font-size:24px} h2{margin:0 0 2px;font-size:15px}
    .sub{color:#6d7a72;margin:0 0 16px;font-size:13px}
    .muted{color:#6d7a72;font-size:11px;margin:0 0 10px}
    .kpis{display:flex;gap:10px;margin-bottom:10px}
    .kpi{flex:1;border:1px solid #bccac0;border-radius:8px;padding:10px;font-size:11px;color:#6d7a72}
    .kpi span{display:block} .kpi b{display:block;font-size:16px;margin:3px 0 2px}
    .kpi i{display:block;font-style:normal;font-size:10px;color:#6d7a72}
    .card{border:1px solid #bccac0;border-radius:10px;padding:16px;margin-top:16px;page-break-inside:avoid}
    .row{display:flex;align-items:center;gap:20px} .grow{flex:1}
    table{width:100%;border-collapse:collapse;font-size:12px}
    td,th{padding:6px 4px;border-bottom:1px solid #e0e3e5;text-align:left} .r{text-align:right}
    .dot{display:inline-block;width:8px;height:8px;border-radius:4px;margin-right:6px}
    .legend{font-size:11px;color:#3d4a42;margin:0 0 4px}
    .net{margin-top:10px;font-size:12px;color:#3d4a42;display:flex;justify-content:space-between}
  </style></head><body>
    <p class="eyebrow">FINORA ANALÍTICO</p>
    <h1>Relatórios &amp; Análise</h1>
    <p class="sub">${esc(period.label)}</p>

    <div class="kpis">
      ${kpi('Receitas', formatBRL(a.income), '', '#006948')}
      ${kpi('Despesas', formatBRL(a.expense), '', '#ba1a1a')}
      ${kpi('Saldo', money(a.net), '', a.net < 0 ? '#ba1a1a' : '#006948')}
    </div>
    <div class="kpis">
      ${kpi('Média diária', `R$ ${formatDecimal(a.dailyAverage)}`, delta, '#191c1e').replace('<i>', `<i style="color:${deltaColor}">`)}
      ${kpi('Poupado', formatPercent(a.savingsRate), `Meta: ${Math.round(SAVINGS_GOAL * 100)}%`, a.savingsRate < 0 ? '#ba1a1a' : '#006948')}
      ${kpi('Maior gasto', a.biggest ? `R$ ${formatDecimal(a.biggest.amount)}` : '—', a.biggest ? esc(a.biggest.description) : '')}
    </div>

    <div class="card">
      <h2>Distribuição de Despesas</h2>
      <p class="muted">Total consumido: ${formatBRL(a.expense)}</p>
      ${
        a.expense > 0
          ? `<div class="row">${donutSvg(a.slices.map((s) => s.share))}<div class="grow"><table>${legend}</table></div></div>`
          : '<p class="muted">Sem despesas neste período.</p>'
      }
    </div>

    <div class="card">
      <h2>Fluxo de Caixa (Últimos 4 Meses)</h2>
      <p class="muted">Comparativo de Receitas vs Despesas</p>
      <p class="legend"><span class="dot" style="background:${FLOW_INCOME}"></span>Entradas &nbsp;&nbsp; <span class="dot" style="background:${FLOW_EXPENSE}"></span>Saídas</p>
      ${flowSvg(a.cashFlow)}
      <table><tr><th>Mês</th><th class="r">Entradas</th><th class="r">Saídas</th><th class="r">Líquido</th></tr>${flow}</table>
      <div class="net"><span>Saldo líquido no mês:</span><b style="color:${monthNet < 0 ? '#ba1a1a' : '#006948'}">${money(monthNet)}</b></div>
    </div>
  </body></html>`;
}
