-- Permite ao app (ainda sem login) saber se um e-mail já tem conta, para barrar cadastros duplicados.
-- Retorna só um booleano; não expõe nenhum dado do usuário.
create or replace function public.email_registered(p_email text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from auth.users where lower(email) = lower(trim(p_email))
  );
$$;

revoke all on function public.email_registered(text) from public;
grant execute on function public.email_registered(text) to anon, authenticated;
