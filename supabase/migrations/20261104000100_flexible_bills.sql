-- Contas de valor variável (luz, água, internet...): o valor é só uma previsão, pode ficar
-- em branco, e o valor real é informado ao pagar.

alter table public.bills add column variable boolean not null default false;

alter table public.bills alter column amount drop not null;
alter table public.bills drop constraint bills_amount_check;
alter table public.bills add constraint bills_amount_check check (amount is null or amount > 0);
-- Conta de valor fixo precisa ter valor; só a variável pode ficar "a definir".
alter table public.bills add constraint bills_fixed_has_amount check (variable or amount is not null);

-- Substitui a função antiga (evita sobrecarga ambígua no PostgREST).
drop function public.pay_bill(uuid);

-- Paga a conta. `p_amount` é o valor realmente pago (obrigatório se a conta não tem valor).
-- Se a conta repete todo mês, cria a próxima: mesma quantia (fixa) ou média das
-- últimas 3 pagas com o mesmo nome (variável).
create or replace function public.pay_bill(p_bill_id uuid, p_amount numeric default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  b public.bills;
  acc uuid;
  tx uuid;
  final_amount numeric(14, 2);
  next_amount numeric(14, 2);
begin
  select * into b from public.bills
   where id = p_bill_id and user_id = (select auth.uid()) and paid_at is null
   for update;
  if not found then
    raise exception 'Conta não encontrada ou já paga' using errcode = 'P0002';
  end if;

  final_amount := coalesce(p_amount, b.amount);
  if final_amount is null or final_amount <= 0 then
    raise exception 'Informe o valor pago' using errcode = '22023';
  end if;

  select id into acc from public.accounts
   where user_id = (select auth.uid()) order by created_at limit 1;
  if acc is null then
    raise exception 'Carteira não encontrada' using errcode = 'P0002';
  end if;

  insert into public.transactions (account_id, category_id, type, amount, description, occurred_on, notes)
  values (acc, b.category_id, 'expense', final_amount, b.name, current_date, b.notes)
  returning id into tx;

  update public.bills
     set paid_at = now(), transaction_id = tx, amount = final_amount
   where id = b.id;

  if b.recurrence = 'monthly' then
    if b.variable then
      select round(avg(x.amount), 2) into next_amount from (
        select amount from public.bills
         where user_id = (select auth.uid()) and name = b.name and paid_at is not null
         order by paid_at desc limit 3
      ) x;
    else
      next_amount := final_amount;
    end if;

    insert into public.bills (name, amount, due_date, category_id, recurrence, notes, variable)
    values (b.name, next_amount, (b.due_date + interval '1 month')::date, b.category_id,
            b.recurrence, b.notes, b.variable);
  end if;

  return tx;
end;
$$;

revoke all on function public.pay_bill(uuid, numeric) from public;
grant execute on function public.pay_bill(uuid, numeric) to authenticated;
