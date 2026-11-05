-- Renomeia o produto para Âncora: a carteira padrão deixa de levar o nome da marca.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));

  insert into public.accounts (user_id, name) values (new.id, 'Carteira');

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

update public.accounts set name = 'Carteira' where name = 'Carteira Finora';
