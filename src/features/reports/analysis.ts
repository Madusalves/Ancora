import { parseDay, type Tx } from '@/features/home/stats';
import { toISODate } from '@/features/transactions/format';
import { t } from '@/i18n/pt-BR';

export type Mode = 'week' | 'month' | 'year' | 'custom';
export const MODES: Mode[] = ['week', 'month', 'year', 'custom'];

/** Meta de poupança mostrada no card "Poupado". */
export const SAVINGS_GOAL = 0.2;

export type Period = { start: Date; end: Date; label: string };

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DAY_MS = 86_400_000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayDiff = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
const pad = (n: number) => String(n).padStart(2, '0');
const shortDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

/** Período selecionado. `anchor` define qual semana/mês/ano; `custom` só vale no modo personalizado. */
export function getPeriod(mode: Mode, anchor: Date, custom: { from: Date; to: Date }): Period {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  switch (mode) {
    case 'week': {
      const start = startOfDay(anchor);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const sameMonth = start.getMonth() === end.getMonth();
      const label = sameMonth
        ? `${start.getDate()} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`
        : `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
      return { start, end, label };
    }
    case 'month':
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0), label: `${t.tx.months[m]} ${y}` };
    case 'year':
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31), label: String(y) };
    case 'custom': {
      const [from, to] = custom.from <= custom.to ? [custom.from, custom.to] : [custom.to, custom.from];
      return { start: startOfDay(from), end: startOfDay(to), label: `${shortDate(from)} – ${shortDate(to)}` };
    }
  }
}

/** Move o período para o anterior (-1) ou o próximo (+1). */
export function shiftAnchor(mode: Mode, anchor: Date, dir: -1 | 1): Date {
  const d = new Date(anchor);
  if (mode === 'week') d.setDate(d.getDate() + 7 * dir);
  else if (mode === 'month') d.setMonth(d.getMonth() + dir, 1);
  else if (mode === 'year') d.setFullYear(d.getFullYear() + dir, 0, 1);
  return d;
}

/** Período imediatamente anterior, com a mesma duração (usado nas variações). */
export function previousPeriod(mode: Mode, anchor: Date, period: Period): Period {
  if (mode === 'custom') {
    const days = dayDiff(period.start, period.end) + 1;
    const end = new Date(period.start);
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    return { start, end, label: '' };
  }
  return getPeriod(mode, shiftAnchor(mode, anchor, -1), { from: period.start, to: period.end });
}

const inPeriod = (txs: Tx[], p: Period) => {
  const a = toISODate(p.start);
  const b = toISODate(p.end);
  return txs.filter((x) => x.occurred_on >= a && x.occurred_on <= b);
};
const sum = (txs: Tx[]) => txs.reduce((s, x) => s + x.amount, 0);

export type CategorySlice = { name: string; amount: number; share: number };

export type Analysis = {
  income: number;
  expense: number;
  net: number;
  count: number;
  dailyAverage: number;
  /** Variação da média diária contra o período anterior (null sem base de comparação). */
  dailyDelta: number | null;
  /** (receitas - despesas) / receitas, 0 sem receitas. */
  savingsRate: number;
  biggest: { amount: number; description: string } | null;
  /** Até 3 categorias + "Outros". */
  slices: CategorySlice[];
  /** Quatro últimos meses até o fim do período. */
  cashFlow: { key: string; label: string; income: number; expense: number }[];
};

function dailyAverage(expense: number, p: Period, today: Date) {
  const last = p.end > today && p.start <= today ? today : p.end;
  const days = Math.max(1, dayDiff(p.start, last) + 1);
  return expense / days;
}

export function analyze(txs: Tx[], mode: Mode, anchor: Date, period: Period, today: Date): Analysis {
  const current = inPeriod(txs, period);
  const expenses = current.filter((x) => x.type === 'expense');
  const income = sum(current.filter((x) => x.type === 'income'));
  const expense = sum(expenses);

  const prev = previousPeriod(mode, anchor, period);
  const prevExpense = sum(inPeriod(txs, prev).filter((x) => x.type === 'expense'));
  const avg = dailyAverage(expense, period, today);
  const prevAvg = dailyAverage(prevExpense, prev, today);

  const byCategory = new Map<string, number>();
  for (const x of expenses) {
    const name = x.category?.name ?? t.home.uncategorized;
    byCategory.set(name, (byCategory.get(name) ?? 0) + x.amount);
  }
  const sorted = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 3);
  const rest = sorted.slice(3).reduce((s, [, v]) => s + v, 0);
  const slices: CategorySlice[] = [...top.map(([name, amount]) => ({ name, amount })), ...(rest > 0 ? [{ name: 'Outros', amount: rest }] : [])].map(
    (c) => ({ ...c, share: expense > 0 ? c.amount / expense : 0 }),
  );

  const biggestTx = expenses.reduce<Tx | null>((best, x) => (!best || x.amount > best.amount ? x : best), null);

  const cashFlow = Array.from({ length: 4 }, (_, k) => {
    const first = new Date(period.end.getFullYear(), period.end.getMonth() - (3 - k), 1);
    const key = `${first.getFullYear()}-${first.getMonth()}`;
    const month = txs.filter((x) => {
      const d = parseDay(x.occurred_on);
      return d.getFullYear() === first.getFullYear() && d.getMonth() === first.getMonth();
    });
    return {
      key,
      label: MONTHS_SHORT[first.getMonth()],
      income: sum(month.filter((x) => x.type === 'income')),
      expense: sum(month.filter((x) => x.type === 'expense')),
    };
  });

  return {
    income,
    expense,
    net: income - expense,
    count: current.length,
    dailyAverage: avg,
    dailyDelta: prevAvg > 0 ? (avg - prevAvg) / prevAvg : null,
    savingsRate: income > 0 ? (income - expense) / income : 0,
    biggest: biggestTx ? { amount: biggestTx.amount, description: biggestTx.description } : null,
    slices,
    cashFlow,
  };
}

const oneDecimal = (v: number) => (Math.round(Math.abs(v) * 1000) / 10).toFixed(1).replace('.', ',');

/** 0.042 → "+4,2%"; -0.1 → "-10,0%". */
export const formatPercentDelta = (v: number) => `${v < 0 ? '-' : '+'}${oneDecimal(v)}%`;

/** 0.24 → "24,0%". */
export const formatPercent = (v: number) => `${v < 0 ? '-' : ''}${oneDecimal(v)}%`;

export { inPeriod };
