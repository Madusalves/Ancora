import { toISODate } from '@/features/transactions/format';

export type Tx = {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  occurred_on: string; // YYYY-MM-DD
  created_at: string;
  description: string;
  category: { name: string; icon: string } | null;
};

export type Range = '1S' | '1M' | '3M' | '1A';
export type Bucket = { key: string; label: string; value: number };

export const RANGES: Range[] = ['1S', '1M', '3M', '1A'];

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const parseDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const sum = (txs: Tx[]) => txs.reduce((s, t) => s + t.amount, 0);

/** Início do período: semana (segunda), mês atual, 3 meses ou 12 meses. */
export function rangeStart(range: Range, now: Date): Date {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (range) {
    case '1S': {
      const d = new Date(y, m, now.getDate());
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return d;
    }
    case '1M':
      return new Date(y, m, 1);
    case '3M':
      return new Date(y, m - 2, 1);
    case '1A':
      return new Date(y, m - 11, 1);
  }
}

/** Gastos agrupados para as barras do gráfico. */
export function buildBuckets(range: Range, txs: Tx[], now: Date): Bucket[] {
  const expenses = txs.filter((t) => t.type === 'expense');

  if (range === '1S') {
    const start = rangeStart(range, now);
    return WEEKDAYS.map((label, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const key = toISODate(day);
      return { key, label, value: sum(expenses.filter((t) => t.occurred_on === key)) };
    });
  }

  if (range === '1M') {
    const y = now.getFullYear();
    const m = now.getMonth();
    const weeks = Math.ceil(new Date(y, m + 1, 0).getDate() / 7);
    return Array.from({ length: weeks }, (_, i) => ({
      key: `w${i}`,
      label: `S${i + 1}`,
      value: sum(
        expenses.filter((t) => {
          const d = parseDay(t.occurred_on);
          return d.getFullYear() === y && d.getMonth() === m && Math.floor((d.getDate() - 1) / 7) === i;
        }),
      ),
    }));
  }

  const count = range === '3M' ? 3 : 12;
  return Array.from({ length: count }, (_, k) => {
    const first = new Date(now.getFullYear(), now.getMonth() - (count - 1 - k), 1);
    return {
      key: `${first.getFullYear()}-${first.getMonth()}`,
      label: MONTHS[first.getMonth()],
      value: sum(
        expenses.filter((t) => {
          const d = parseDay(t.occurred_on);
          return d.getFullYear() === first.getFullYear() && d.getMonth() === first.getMonth();
        }),
      ),
    };
  });
}

/** Receitas e despesas dentro do período selecionado. */
export function periodTotals(range: Range, txs: Tx[], now: Date) {
  const startIso = toISODate(rangeStart(range, now));
  const inRange = txs.filter((t) => t.occurred_on >= startIso);
  return {
    income: sum(inRange.filter((t) => t.type === 'income')),
    expense: sum(inRange.filter((t) => t.type === 'expense')),
  };
}

export type MonthSummary = {
  income: number;
  expense: number;
  count: number;
  /** Parcela da renda que foi gasta (0..1, limitada). */
  spentShare: number;
  /** (receitas - despesas) / receitas, ou 0 sem receitas. Pode ser negativa. */
  savingsRate: number;
  top: { name: string; icon: string; amount: number; share: number }[];
};

export function monthSummary(txs: Tx[], now: Date): MonthSummary {
  const y = now.getFullYear();
  const m = now.getMonth();
  const month = txs.filter((t) => {
    const d = parseDay(t.occurred_on);
    return d.getFullYear() === y && d.getMonth() === m;
  });
  const income = sum(month.filter((t) => t.type === 'income'));
  const expenses = month.filter((t) => t.type === 'expense');
  const expense = sum(expenses);

  const byCategory = new Map<string, { name: string; icon: string; amount: number }>();
  for (const t of expenses) {
    const name = t.category?.name ?? 'Sem categoria';
    const cur = byCategory.get(name) ?? { name, icon: t.category?.icon ?? '', amount: 0 };
    cur.amount += t.amount;
    byCategory.set(name, cur);
  }
  const top = [...byCategory.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map((c) => ({ ...c, share: expense > 0 ? c.amount / expense : 0 }));

  return {
    income,
    expense,
    count: month.length,
    spentShare: income > 0 ? Math.min(expense / income, 1) : expense > 0 ? 1 : 0,
    savingsRate: income > 0 ? (income - expense) / income : 0,
    top,
  };
}
