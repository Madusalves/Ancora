import { formatBRL } from '@/features/transactions/format';
import { t } from '@/i18n/pt-BR';

import type { Bill } from './api';

/** "R$ 120,00" · "≈ R$ 120,00" (previsto, conta variável) · "Valor a definir" */
export function billAmountLabel(bill: Pick<Bill, 'amount' | 'variable'>): string {
  if (bill.amount === null) return t.bills.amountTbd;
  return bill.variable ? `≈ ${formatBRL(bill.amount)}` : formatBRL(bill.amount);
}

/** Valor da última conta paga com o mesmo nome (para comparar com a atual). */
export function lastPaidAmount(bills: Bill[], name: string): number | null {
  let best: Bill | null = null;
  for (const b of bills) {
    if (!b.paid_at || b.amount === null || b.name !== name) continue;
    if (!best || b.paid_at > best.paid_at!) best = b;
  }
  return best?.amount ?? null;
}
