import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type TxType = 'expense' | 'income';

export type Category = { id: string; name: string; icon: string; kind: TxType };
export type Account = { id: string; name: string; balance: number };

export type NewTransaction = {
  accountId: string;
  categoryId: string | null;
  type: TxType;
  amount: number;
  description: string;
  occurredOn: string; // YYYY-MM-DD
  notes: string | null;
  tags: string[];
  recurring: boolean;
};

export function useCategories(kind: TxType) {
  return useQuery({
    queryKey: ['categories', kind],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon, kind')
        .eq('kind', kind)
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; icon: string; kind: TxType }): Promise<Category> => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: input.name, icon: input.icon, kind: input.kind })
        .select('id, name, icon, kind')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase
        .from('account_balances')
        .select('id, name, balance')
        .order('name');
      if (error) throw error;
      return data.map((a) => ({ id: a.id, name: a.name, balance: Number(a.balance) }));
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: NewTransaction) => {
      const { error } = await supabase.from('transactions').insert({
        account_id: tx.accountId,
        category_id: tx.categoryId,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        occurred_on: tx.occurredOn,
        notes: tx.notes,
        tags: tx.tags,
        is_recurring: tx.recurring,
        recurrence: tx.recurring ? 'monthly' : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
