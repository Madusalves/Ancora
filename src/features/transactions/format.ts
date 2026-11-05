import { t } from '@/i18n/pt-BR';

/** 142.5 → "142,50"; 3840.2 → "3.840,20" (formatação manual, sem depender de Intl). */
export function formatDecimal(value: number): string {
  const [int, frac] = Math.abs(value).toFixed(2).split('.');
  return `${value < 0 ? '-' : ''}${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${frac}`;
}

export const formatBRL = (value: number) => `R$ ${formatDecimal(value)}`;

/** Centavos digitados ("14250") → "142,50". */
export function formatCents(digits: string): string {
  return formatDecimal((parseInt(digits || '0', 10) || 0) / 100);
}

/** Date → "2024-10-24" (data local, sem fuso). */
export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Date → "24 de Outubro, 2024". */
export function formatLongDate(d: Date): string {
  return `${d.getDate()} de ${t.tx.months[d.getMonth()]}, ${d.getFullYear()}`;
}

export const isSameDay = (a: Date, b: Date) => toISODate(a) === toISODate(b);

/** "#mercado, #compras, essencial" → ["mercado", "compras", "essencial"] */
export function parseTags(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim().replace(/^#+/, '').trim())
    .filter(Boolean);
}

/** 75000 → "R$ 75k"; 1500 → "R$ 1,5k"; 2300000 → "R$ 2,3M"; abaixo de mil mantém centavos só se houver. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const trim = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');
  if (abs >= 1_000_000) return `R$ ${trim(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `R$ ${trim(abs / 1_000)}k`;
  return `R$ ${Number.isInteger(abs) ? abs : formatDecimal(abs)}`;
}
