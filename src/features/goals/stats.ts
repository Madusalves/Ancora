import { parseDay, type Tx } from '@/features/home/stats';
import { colors } from '@/theme';

export type LimitStatus = 'ok' | 'watch' | 'warn' | 'over';

/** Fração do teto → situação: <50% ok, 50–84% atenção, 85–99% alerta, ≥100% estourado. */
export function limitStatus(ratio: number): LimitStatus {
  if (ratio >= 1) return 'over';
  if (ratio >= 0.85) return 'warn';
  if (ratio >= 0.5) return 'watch';
  return 'ok';
}

export const STATUS_COLOR: Record<LimitStatus, string> = {
  ok: colors.primary,
  watch: colors.primary,
  warn: '#f59e0b',
  over: colors.error,
};

export const STATUS_SOFT: Record<LimitStatus, string> = {
  ok: colors.primaryContainerTint,
  watch: colors.primaryContainerTint,
  warn: colors.warningSoft,
  over: colors.errorSoft,
};

export type MonthSpend = {
  total: number;
  byCategory: Map<string, number>;
  /** Média diária até hoje. */
  dailyAvg: number;
};

/** Despesas do mês de `now`, somadas no total e por nome de categoria. */
export function monthSpend(txs: Tx[], now: Date): MonthSpend {
  const byCategory = new Map<string, number>();
  let total = 0;
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    const d = parseDay(t.occurred_on);
    if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) continue;
    total += t.amount;
    if (t.category) byCategory.set(t.category.name, (byCategory.get(t.category.name) ?? 0) + t.amount);
  }
  return { total, byCategory, dailyAvg: total / Math.max(now.getDate(), 1) };
}
