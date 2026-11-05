-- Contas a pagar (luz, água, aluguel...) com vencimento.
-- Todos os valores são digitados pelo usuário; nada aqui se conecta a banco ou cartão.

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null check (length(trim(name)) > 0),
  amount numeric(14, 2) not null check (amount > 0),
  due_date date not null,
  category_id uuid references public.categories (id) on delete set null,
  recurrence public.recurrence_interval, -- 'monthly' = gera a próxima conta ao pagar
  notes text,
  paid_at timestamptz,
  transaction_id uuid references public.transactions (id) on delete set null,
  created_at timestamptz not null default now()
);

create index bills_user_due_idx on public.bills (user_id, due_date);
create index bills_user_open_idx on public.bills (user_id, due_date) where paid_at is null;

alter table public.bills enable row level security;

create policy "bills: dono" on public.bills
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (category_id is null or exists (
      select 1 from public.categories c where c.id = category_id and c.user_id = (select auth.uid())
    ))
  );

-- Paga a conta: registra a despesa na carteira interna, marca como paga e, se for
-- mensal, cria a próxima. Tudo numa transação só. Roda com as permissões de quem chama (RLS).
create or replace function public.pay_bill(p_bill_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  b public.bills;
  acc uuid;
  tx uuid;
begin
  select * into b from public.bills
   where id = p_bill_id and user_id = (select auth.uid()) and paid_at is null
   for update;
  if not found then
    raise exception 'Conta não encontrada ou já paga' using errcode = 'P0002';
  end if;

  select id into acc from public.accounts
   where user_id = (select auth.uid()) order by created_at limit 1;
  if acc is null then
    raise exception 'Carteira não encontrada' using errcode = 'P0002';
  end if;

  insert into public.transactions (account_id, category_id, type, amount, description, occurred_on, notes)
  values (acc, b.category_id, 'expense', b.amount, b.name, current_date, b.notes)
  returning id into tx;

  update public.bills set paid_at = now(), transaction_id = tx where id = b.id;

  if b.recurrence = 'monthly' then
    insert into public.bills (name, amount, due_date, category_id, recurrence, notes)
    values (b.name, b.amount, (b.due_date + interval '1 month')::date, b.category_id, b.recurrence, b.notes);
  end if;

  return tx;
end;
$$;

revoke all on function public.pay_bill(uuid) from public;
grant execute on function public.pay_bill(uuid) to authenticated;
