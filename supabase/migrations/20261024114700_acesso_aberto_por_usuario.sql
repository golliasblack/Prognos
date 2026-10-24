-- Acesso aberto: qualquer pessoa com e-mail confirmado usa o Prognos.
-- Cada conta tem a sua própria base (arquivos, trechos, eventos, conversas); ninguém vê os dados de outra conta.
-- Para bloquear alguém: insert into bloqueados(email,motivo) values ('pessoa@x.com','abuso');

create table if not exists public.bloqueados (email text primary key, motivo text, criado_em timestamptz default now());
alter table public.bloqueados enable row level security;

create or replace function public.sou_membro() returns boolean language sql stable security definer set search_path=public as $$
  select auth.uid() is not null
     and not exists(select 1 from public.bloqueados where lower(email)=lower(coalesce(auth.jwt()->>'email','')))
$$;

alter table public.arquivos add column dono uuid not null default auth.uid() references auth.users(id) on delete cascade;
alter table public.trechos  add column dono uuid not null default auth.uid() references auth.users(id) on delete cascade;
alter table public.eventos  add column dono uuid not null default auth.uid() references auth.users(id) on delete cascade;

alter table public.arquivos drop constraint arquivos_caminho_key;
alter table public.arquivos add constraint arquivos_dono_caminho_key unique (dono, caminho);
alter table public.eventos drop constraint eventos_chave_key;
alter table public.eventos add constraint eventos_dono_chave_key unique (dono, chave);
create index trechos_dono_idx on public.trechos(dono);

drop policy if exists arq_all on public.arquivos; drop policy if exists tre_all on public.trechos; drop policy if exists eve_all on public.eventos;
create policy arq_dono on public.arquivos for all to authenticated using (dono=(select auth.uid()) and (select public.sou_membro())) with check (dono=(select auth.uid()) and (select public.sou_membro()));
create policy tre_dono on public.trechos  for all to authenticated using (dono=(select auth.uid()) and (select public.sou_membro())) with check (dono=(select auth.uid()) and (select public.sou_membro()));
create policy eve_dono on public.eventos  for all to authenticated using (dono=(select auth.uid()) and (select public.sou_membro())) with check (dono=(select auth.uid()) and (select public.sou_membro()));

alter table public.docs alter column owner set not null;
drop policy if exists docs_read on public.docs; drop policy if exists docs_ins on public.docs; drop policy if exists docs_upd on public.docs; drop policy if exists docs_del on public.docs;
create policy docs_dono on public.docs for all to authenticated using (owner=(select auth.uid()) and (select public.sou_membro())) with check (owner=(select auth.uid()) and (select public.sou_membro()));

-- cota diária de IA por pessoa (protege as chaves gratuitas compartilhadas); limite no secret LIMITE_DIARIO_IA
create table public.uso_ia (dono uuid not null references auth.users(id) on delete cascade, dia date not null default current_date, chamadas int not null default 0, primary key (dono, dia));
alter table public.uso_ia enable row level security;
create policy uso_ia_ler on public.uso_ia for select to authenticated using (dono=(select auth.uid()));
create or replace function public.registrar_uso_ia() returns int language sql volatile security definer set search_path=public as $$
  insert into public.uso_ia(dono, dia, chamadas) values (auth.uid(), current_date, 1)
  on conflict (dono, dia) do update set chamadas = public.uso_ia.chamadas + 1
  returning chamadas
$$;
revoke execute on function public.registrar_uso_ia() from anon, public;
grant execute on function public.registrar_uso_ia() to authenticated;
