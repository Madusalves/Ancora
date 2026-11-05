-- Finora: schema inicial (perfis, contas, categorias, transações, orçamentos, limites)

create type public.transaction_type as enum ('expense', 'income');
create type public.recurrence_interval as enum ('monthly');

-- Perfis ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- Contas / carteiras ---------------------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  initial_balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index accounts_user_idx on public.accounts (user_id);

-- Categorias -----------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  icon text not null default 'tag',
  kind public.transaction_type not null default 'expense',
  description text,
  created_at timestamptz not null default now(),
  unique (user_id, name, kind)
);
create index categories_user_idx on public.categories (user_id);

-- Transações -----------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  account_id uuid not null references public.accounts (id) on delete restrict,
  category_id uuid references public.categories (id) on delete set null,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  description text not null,
  occurred_on date not null default current_date,
  notes text,
  tags text[] not null default '{}',
  is_recurring boolean not null default false,
  recurrence public.recurrence_interval,
  created_at timestamptz not null default now(),
  check (is_recurring = (recurrence is not null))
);
create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc);
create index transactions_category_idx on public.transactions (category_id);

-- Orçamento mensal total ----------------------------------------------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  month date not null check (month = date_trunc('month', month)::date),
  total_limit numeric(14, 2) not null check (total_limit >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

-- Limite (teto) mensal por categoria ----------------------------------
create table public.category_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  monthly_limit numeric(14, 2) not null check (monthly_limit >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id)
);

-- Row Level Security ---------------------------------------------------
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.category_limits enable row level security;

create policy "profiles: dono" on public.profiles
  for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "accounts: dono" on public.accounts
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "categories: dono" on public.categories
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "budgets: dono" on public.budgets
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Garante que conta e categoria referenciadas pertencem ao mesmo usuário.
create policy "transactions: dono" on public.transactions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid()))
    and (category_id is null or exists (
      select 1 from public.categories c where c.id = category_id and c.user_id = (select auth.uid())
    ))
  );

create policy "category_limits: dono" on public.category_limits
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.categories c where c.id = category_id and c.user_id = (select auth.uid()))
  );

-- Saldo por conta (respeita RLS do usuário que consulta) ---------------
create view public.account_balances
with (security_invoker = true) as
select
  a.id,
  a.user_id,
  a.name,
  a.initial_balance
    + coalesce(sum(case t.type when 'income' then t.amount else -t.amount end), 0) as balance
from public.accounts a
left join public.transactions t on t.account_id = a.id
group by a.id;

-- Novo usuário: perfil, carteira e categorias padrão -------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));

  insert into public.accounts (user_id, name) values (new.id, 'Carteira Finora');

  insert into public.categories (user_id, name, icon, kind, description) values
    (new.id, 'Alimentação', 'restaurant', 'expense', 'Mercado, Delivery e Restaurantes'),
    (new.id, 'Transporte', 'car', 'expense', 'Combustível, Uber e Manutenção'),
    (new.id, 'Saúde', 'medical', 'expense', 'Consultas, Farmácia e Plano'),
    (new.id, 'Moradia', 'home', 'expense', 'Aluguel, Luz, Água e Internet'),
    (new.id, 'Lazer', 'film', 'expense', 'Streaming, Cinema e Viagens'),
    (new.id, 'Educação', 'school', 'expense', 'Cursos, Livros e Mensalidades'),
    (new.id, 'Salário', 'cash', 'income', 'Salário e Investimentos');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
