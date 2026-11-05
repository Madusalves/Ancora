-- Exclusão de conta pelo próprio usuário (exigência do Google Play).
-- Apaga o usuário em auth.users; todas as tabelas do app têm `on delete cascade`
-- a partir dele (profiles, accounts, categories, transactions, budgets, category_limits, bills),
-- então os dados financeiros somem juntos.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
