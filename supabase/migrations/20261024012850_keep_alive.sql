-- Tabela que o GitHub Actions escreve a cada 3 dias para o plano free não pausar o projeto.
create table public.keep_alive (id bigint generated always as identity primary key, origem text default 'github-actions' check (length(origem)<=40), criado_em timestamptz default now());
alter table public.keep_alive enable row level security;
create policy keepalive_insert on public.keep_alive for insert to anon with check (true);
create policy keepalive_select on public.keep_alive for select to anon using (true);
-- Limpa registros com mais de 60 dias a cada inserção
create or replace function public.keep_alive_limpa() returns trigger language plpgsql security definer set search_path=public as $$
begin delete from public.keep_alive where criado_em < now() - interval '60 days'; return null; end $$;
revoke execute on function public.keep_alive_limpa() from anon, authenticated, public;
create trigger keep_alive_limpa after insert on public.keep_alive for each statement execute function public.keep_alive_limpa();
