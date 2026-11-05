import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toISODate } from '@/features/transactions/format';
import { supabase } from '@/lib/supabase';

export type CategoryLimit = {
  id: string;
  category_id: string;
  monthly_limit: number;
  category: { name: string; icon: string; description: string | null };
};

type RawLimit = Omit<CategoryLimit, 'monthly_limit'> & { monthly_limit: number | string };

const firstOfMonth = (d: Date) => toISODate(new Date(d.getFullYear(), d.getMonth(), 1));

/** Orçamento total do mês atual; sem um específico, vale o mais recente já definido. */
export function useBudget() {
  return useQuery({
    queryKey: ['budget'],
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase
        .from('budgets')
        .select('total_limit')
        .lte('month', firstOfMonth(new Date()))
        .order('month', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data.length ? Number(data[0].total_limit) : null;
    },
  });
}

export function useSetBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (total: number) => {
      const { error } = await supabase
        .from('budgets')
        .upsert({ month: firstOfMonth(new Date()), total_limit: total }, { onConflict: 'user_id,month' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budget'] }),
  });
}

export function useCategoryLimits() {
  return useQuery({
    queryKey: ['limits'],
    queryFn: async (): Promise<CategoryLimit[]> => {
      const { data, error } = await supabase
        .from('category_limits')
        .select('id, category_id, monthly_limit, category:categories(name, icon, description)')
        .order('created_at');
      if (error) throw error;
      return (data as unknown as RawLimit[]).map((l) => ({ ...l, monthly_limit: Number(l.monthly_limit) }));
    },
  });
}

export function useSetLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ categoryId, limit }: { categoryId: string; limit: number }) => {
      const { error } = await supabase
        .from('category_limits')
        .upsert({ category_id: categoryId, monthly_limit: limit }, { onConflict: 'user_id,category_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['limits'] }),
  });
}

export function useDeleteLimit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('category_limits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['limits'] }),
  });
}
