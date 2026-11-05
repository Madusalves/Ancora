import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type Bill = {
  id: string;
  name: string;
  /** Valor da conta. Em contas variáveis é só uma previsão e pode ser `null` ("a definir"). */
  amount: number | null;
  variable: boolean;
  category_id: string | null;
  due_date: string; // YYYY-MM-DD
  recurrence: 'monthly' | null;
  paid_at: string | null;
  category: { name: string; icon: string } | null;
};

type RawBill = Omit<Bill, 'amount'> & { amount: number | string | null };

export type NewBill = {
  name: string;
  amount: number | null;
  dueDate: string;
  categoryId: string | null;
  recurring: boolean;
  variable: boolean;
};

/** Todas as contas em aberto + as pagas nos últimos 60 dias. */
export function useBills() {
  return useQuery({
    queryKey: ['bills'],
    queryFn: async (): Promise<Bill[]> => {
      const since = new Date(Date.now() - 60 * 86_400_000).toISOString();
      const { data, error } = await supabase
        .from('bills')
        .select('id, name, amount, variable, category_id, due_date, recurrence, paid_at, category:categories(name, icon)')
        .or(`paid_at.is.null,paid_at.gte.${since}`)
        .order('due_date', { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data as unknown as RawBill[]).map((b) => ({ ...b, amount: b.amount === null ? null : Number(b.amount) }));
    },
  });
}

export function useCreateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bill: NewBill) => {
      const { error } = await supabase.from('bills').insert({
        name: bill.name,
        amount: bill.amount,
        due_date: bill.dueDate,
        category_id: bill.categoryId,
        recurrence: bill.recurring ? 'monthly' : null,
        variable: bill.variable,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });
}

export function useUpdateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...bill }: NewBill & { id: string }) => {
      const { error } = await supabase
        .from('bills')
        .update({
          name: bill.name,
          amount: bill.amount,
          due_date: bill.dueDate,
          category_id: bill.categoryId,
          recurrence: bill.recurring ? 'monthly' : null,
          variable: bill.variable,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });
}

/** Paga: o banco cria a despesa e, se for mensal, a conta do mês seguinte. */
export function usePayBill() {
  const qc = useQueryClient();
  return useMutation({
    /** `amount` = valor realmente pago; sem ele vale o valor cadastrado na conta. */
    mutationFn: async ({ id, amount }: { id: string; amount?: number }) => {
      const { error } = await supabase.rpc('pay_bill', { p_bill_id: id, p_amount: amount ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });
}
