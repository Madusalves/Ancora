import { parseDay } from '@/features/home/stats';
import { t } from '@/i18n/pt-BR';
import { colors } from '@/theme';

export type DueStatus = 'overdue' | 'today' | 'soon' | 'later';

export const STATUS_COLOR: Record<DueStatus, string> = {
  overdue: colors.error,
  today: colors.warning,
  soon: colors.warning,
  later: colors.textMuted,
};

const pad = (n: number) => String(n).padStart(2, '0');
export const shortDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

/** Dias entre hoje e o vencimento (negativo = atrasada). Compara só a data, sem horas. */
export function daysUntil(dueDate: string, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseDay(dueDate).getTime() - today.getTime()) / 86_400_000);
}

export function dueInfo(dueDate: string, now = new Date()): { status: DueStatus; label: string } {
  const days = daysUntil(dueDate, now);
  const b = t.bills;
  if (days < 0) return { status: 'overdue', label: b.overdue(-days) };
  if (days === 0) return { status: 'today', label: b.dueToday };
  if (days === 1) return { status: 'soon', label: b.dueTomorrow };
  if (days <= 7) return { status: 'soon', label: b.dueIn(days) };
  return { status: 'later', label: b.dueOn(shortDate(parseDay(dueDate))) };
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Mês de referência (do vencimento) por extenso, ex.: "novembro". */
export const refMonth = (dueDate: string) => MONTHS[parseDay(dueDate).getMonth()];

/** O vencimento cai em um mês posterior ao atual? */
export function isNextMonthOrLater(dueDate: string, now = new Date()): boolean {
  const d = parseDay(dueDate);
  return d.getFullYear() * 12 + d.getMonth() > now.getFullYear() * 12 + now.getMonth();
}
