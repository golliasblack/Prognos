-- Modelos 3D já montados: reabrir não gasta IA. Os da unidade ficam na unidade; os genéricos (só famílias de catálogo) vão para a rede.
create table public.modelos_3d (id bigint generated always as identity primary key, criado_em timestamptz default now(),
  org uuid default public.org_atual() references public.organizacoes(id) on delete cascade, unidade uuid default public.unidade_atual() references public.unidades(id) on delete cascade,
  dono uuid default auth.uid() references auth.users(id) on delete set null, nome text not null check (length(nome)<=200), familia text, chave text,
  modelo jsonb not null check (pg_column_size(modelo) < 400000), publico boolean not null default false, usos int not null default 0,
  tsv tsvector generated always as (to_tsvector('portuguese', coalesce(nome,'')||' '||coalesce(familia,'')||' '||coalesce(chave,''))) stored);
create index modelos_3d_tsv on public.modelos_3d using gin(tsv); create index modelos_3d_unidade on public.modelos_3d(unidade); create index modelos_3d_chave on public.modelos_3d(chave);
alter table public.modelos_3d enable row level security;
create policy m3d_ler on public.modelos_3d for select to authenticated using ((select public.sou_membro()) and (publico or unidade=(select public.unidade_atual())));
create policy m3d_ins on public.modelos_3d for insert to authenticated with check ((select public.sou_membro()) and dono=(select auth.uid()) and (publico or unidade=(select public.unidade_atual())));
create policy m3d_del on public.modelos_3d for delete to authenticated using (dono=(select auth.uid()) or (unidade=(select public.unidade_atual()) and (select public.pode_atualizar_base())));
-- quem publica na rede não aparece
revoke select on public.modelos_3d from authenticated, anon;
grant select (id,criado_em,unidade,nome,familia,chave,modelo,publico,usos,tsv) on public.modelos_3d to authenticated;
grant insert (nome,familia,chave,modelo,publico,unidade,org) on public.modelos_3d to authenticated;
grant delete on public.modelos_3d to authenticated;
create or replace function public.modelo_3d_usado(mid bigint) returns void language sql security definer set search_path=public as $$
  update public.modelos_3d set usos=usos+1 where id=mid and (publico or unidade=public.unidade_atual()) $$;
revoke execute on function public.modelo_3d_usado(bigint) from anon, public; grant execute on function public.modelo_3d_usado(bigint) to authenticated;
