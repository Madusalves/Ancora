import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toISODate } from '@/features/transactions/format';
import { supabase } from '@/lib/supabase';

import type { Tx } from './stats';

type RawTx = Omit<Tx, 'amount'> & { amount: number | string };

/** Transações dos últimos 12 meses (cobre todos os períodos do gráfico), mais recentes primeiro. */
export function useRecentTransactions() {
  return useQuery({
    queryKey: ['transactions', '12m'],
    queryFn: async (): Promise<Tx[]> => {
      const from = new Date();
      from.setMonth(from.getMonth() - 12);
      from.setDate(1);
      const { data, error } = await supabase
        .from('transactions')
        .select('id, type, amount, occurred_on, created_at, description, category:categories(name, icon)')
        .gte('occurred_on', toISODate(from))
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data as unknown as RawTx[]).map((r) => ({ ...r, amount: Number(r.amount) }));
    },
  });
}

/** Altera só o nome de exibição (metadado); o e-mail de login não muda. */
export function useUpdateName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fullName: string) => {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

/** Nome para exibir: metadado do login (Google) ou a parte local do e-mail. */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      const meta = user?.user_metadata ?? {};
      const full: string = meta.full_name ?? meta.name ?? '';
      const fallback = (user?.email ?? '').split('@')[0].replace(/[._-]+/g, ' ');
      const name = (full || fallback).trim();
      const first = name.split(/\s+/)[0] ?? '';
      return {
        /** true quando o usuário (ou o Google) já definiu um nome, em vez de derivá-lo do e-mail. */
        hasName: !!full.trim(),
        fullName: name
          .split(/\s+/)
          .filter(Boolean)
          .map((p) => p[0].toUpperCase() + p.slice(1))
          .join(' '),
        email: user?.email ?? '',
        avatarUrl: (meta.avatar_url ?? meta.picture ?? null) as string | null,
        firstName: first ? first[0].toUpperCase() + first.slice(1) : '',
        initials: name
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() ?? '')
          .join(''),
      };
    },
  });
}
