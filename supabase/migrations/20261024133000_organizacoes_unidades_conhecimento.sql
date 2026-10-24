-- Empresas, unidades e perfil. A empresa é identificada pelo domínio do e-mail corporativo (confirmado),
-- o que impede alguém de fora entrar na base de uma empresa só digitando o nome dela.
-- E-mails pessoais (gmail, yahoo...) ficam numa organização própria, não compartilhada.
create table public.organizacoes (id uuid primary key default gen_random_uuid(), nome text not null, dominio text unique, criado_em timestamptz default now());
create table public.unidades (id uuid primary key default gen_random_uuid(), org_id uuid not null references public.organizacoes(id) on delete cascade, nome text not null, criado_em timestamptz default now());
create unique index unidades_nome_uq on public.unidades(org_id, lower(nome));
create table public.perfis (usuario uuid primary key references auth.users(id) on delete cascade, org_id uuid not null references public.organizacoes(id), unidade_id uuid not null references public.unidades(id), nome text, criado_em timestamptz default now(), atualizado_em timestamptz default now());
create index perfis_org_idx on public.perfis(org_id); create index perfis_unidade_idx on public.perfis(unidade_id);
alter table public.organizacoes enable row level security; alter table public.unidades enable row level security; alter table public.perfis enable row level security;

create or replace function public.unidade_atual() returns uuid language sql stable security definer set search_path=public as $$ select unidade_id from public.perfis where usuario=auth.uid() $$;
create or replace function public.org_atual() returns uuid language sql stable security definer set search_path=public as $$ select org_id from public.perfis where usuario=auth.uid() $$;

create policy org_ler on public.organizacoes for select to authenticated using (id=(select public.org_atual()));
create policy uni_ler on public.unidades for select to authenticated using (org_id=(select public.org_atual()));
create policy perfil_ler on public.perfis for select to authenticated using (usuario=(select auth.uid()));

create or replace function public.dominio_publico(d text) returns boolean language sql immutable as $$
  select d ~ '^(gmail|googlemail|yahoo|ymail|hotmail|outlook|live|msn|icloud|me|mac|aol|proton|protonmail|pm|gmx|mail|zoho|yandex|bol|uol|terra|ig|r7|globo|globomail|oi|qq|163|126|naver|web|libero|orange|free|laposte|tutanota|hey|fastmail)(\.[a-z]{2,3}){1,2}$'
$$;

-- grava ou troca empresa e unidade do usuário logado
create or replace function public.definir_organizacao(empresa text, unidade text, nome text default null) returns json language plpgsql security definer set search_path=public as $$
declare em text := lower(coalesce(auth.jwt()->>'email','')); dom text := split_part(em,'@',2); o uuid; u uuid; emp text := nullif(trim(empresa),''); uni text := nullif(trim(unidade),'');
begin
  if auth.uid() is null then raise exception 'sem sessão'; end if;
  if emp is null or uni is null then raise exception 'Informe a empresa e a unidade'; end if;
  if length(emp)>120 or length(uni)>120 then raise exception 'Nome muito longo'; end if;
  if public.dominio_publico(dom) then
    select p.org_id into o from public.perfis p join public.organizacoes g on g.id=p.org_id where p.usuario=auth.uid() and g.dominio is null;
    if o is null then insert into public.organizacoes(nome,dominio) values (emp,null) returning id into o; else update public.organizacoes set nome=emp where id=o; end if;
  else
    select id into o from public.organizacoes where dominio=dom;
    if o is null then insert into public.organizacoes(nome,dominio) values (emp,dom) returning id into o; end if;
  end if;
  select id into u from public.unidades where org_id=o and lower(nome)=lower(uni);
  if u is null then insert into public.unidades(org_id,nome) values (o,uni) returning id into u; end if;
  insert into public.perfis(usuario,org_id,unidade_id,nome) values (auth.uid(),o,u,nullif(trim(nome),''))
    on conflict (usuario) do update set org_id=excluded.org_id, unidade_id=excluded.unidade_id, nome=coalesce(excluded.nome,public.perfis.nome), atualizado_em=now();
  return public.meu_perfil();
end $$;

create or replace function public.meu_perfil() returns json language sql stable security definer set search_path=public as $$
  select json_build_object('org',g.id,'empresa',g.nome,'dominio',g.dominio,'compartilhada',g.dominio is not null,'unidade',u.id,'unidade_nome',u.nome,'nome',p.nome,
    'unidades',(select json_agg(x.nome order by x.nome) from public.unidades x where x.org_id=g.id),
    'colegas',(select count(*) from public.perfis q where q.unidade_id=u.id))
  from public.perfis p join public.organizacoes g on g.id=p.org_id join public.unidades u on u.id=p.unidade_id where p.usuario=auth.uid()
$$;
revoke execute on function public.definir_organizacao(text,text,text), public.meu_perfil(), public.unidade_atual(), public.org_atual() from anon, public;
grant execute on function public.definir_organizacao(text,text,text), public.meu_perfil(), public.unidade_atual(), public.org_atual() to authenticated;

-- base da planta compartilhada: escreve na própria unidade, lê a empresa inteira
alter table public.arquivos add column org uuid default public.org_atual() references public.organizacoes(id) on delete cascade, add column unidade uuid default public.unidade_atual() references public.unidades(id) on delete cascade;
alter table public.trechos  add column org uuid default public.org_atual() references public.organizacoes(id) on delete cascade, add column unidade uuid default public.unidade_atual() references public.unidades(id) on delete cascade;
alter table public.eventos  add column org uuid default public.org_atual() references public.organizacoes(id) on delete cascade, add column unidade uuid default public.unidade_atual() references public.unidades(id) on delete cascade;
alter table public.arquivos alter column org set not null, alter column unidade set not null;
alter table public.trechos alter column org set not null, alter column unidade set not null;
alter table public.eventos alter column org set not null, alter column unidade set not null;
alter table public.arquivos drop constraint arquivos_dono_caminho_key; alter table public.arquivos add constraint arquivos_unidade_caminho_key unique (unidade, caminho);
alter table public.eventos drop constraint eventos_dono_chave_key; alter table public.eventos add constraint eventos_unidade_chave_key unique (unidade, chave);
create index arquivos_org_idx on public.arquivos(org); create index trechos_org_idx on public.trechos(org); create index eventos_org_idx on public.eventos(org);
create index trechos_unidade_idx on public.trechos(unidade); create index eventos_unidade_idx on public.eventos(unidade);
drop policy arq_dono on public.arquivos; drop policy tre_dono on public.trechos; drop policy eve_dono on public.eventos;
do $$ declare t text; begin foreach t in array array['arquivos','trechos','eventos'] loop
  execute format('create policy %1$s_ler on public.%1$s for select to authenticated using (org=(select public.org_atual()) and (select public.sou_membro()))', t);
  execute format('create policy %1$s_ins on public.%1$s for insert to authenticated with check (unidade=(select public.unidade_atual()) and org=(select public.org_atual()) and (select public.sou_membro()))', t);
  execute format('create policy %1$s_upd on public.%1$s for update to authenticated using (unidade=(select public.unidade_atual()) and (select public.sou_membro())) with check (unidade=(select public.unidade_atual()) and org=(select public.org_atual()))', t);
  execute format('create policy %1$s_del on public.%1$s for delete to authenticated using (unidade=(select public.unidade_atual()) and (select public.sou_membro()))', t);
end loop; end $$;

-- mapa da base (índice) guardado por unidade, privado
insert into storage.buckets(id,name,public,file_size_limit) values ('mapas','mapas',false,52428800) on conflict (id) do nothing;
create policy mapas_ler on storage.objects for select to authenticated using (bucket_id='mapas' and (storage.foldername(name))[1]=(select public.unidade_atual())::text);
create policy mapas_ins on storage.objects for insert to authenticated with check (bucket_id='mapas' and (storage.foldername(name))[1]=(select public.unidade_atual())::text);
create policy mapas_upd on storage.objects for update to authenticated using (bucket_id='mapas' and (storage.foldername(name))[1]=(select public.unidade_atual())::text);
create policy mapas_del on storage.objects for delete to authenticated using (bucket_id='mapas' and (storage.foldername(name))[1]=(select public.unidade_atual())::text);

-- conhecimento global: lições e vidas anonimizadas, lidas por todos os usuários de todas as empresas
create table public.conhecimento_global (
  id bigint generated always as identity primary key, criado_em timestamptz default now(),
  tipo_componente text not null check (length(tipo_componente)<=80), modo text check (length(modo)<=200), mecanismo text check (length(mecanismo)<=300),
  causa text check (length(causa)<=400), licao text not null check (length(licao)<=1200), setor text check (length(setor)<=60), regime text check (length(regime)<=200),
  desfecho text check (length(desfecho)<=40), vida_h numeric check (vida_h is null or (vida_h>0 and vida_h<2000000)), suspensao boolean default false,
  contribuinte uuid default auth.uid(),
  tsv tsvector generated always as (to_tsvector('portuguese', coalesce(tipo_componente,'')||' '||coalesce(modo,'')||' '||coalesce(mecanismo,'')||' '||coalesce(causa,'')||' '||coalesce(licao,'')||' '||coalesce(setor,''))) stored);
create index cg_tsv_idx on public.conhecimento_global using gin(tsv); create index cg_tipo_idx on public.conhecimento_global(lower(tipo_componente));
alter table public.conhecimento_global enable row level security;
create policy cg_ler on public.conhecimento_global for select to authenticated using ((select public.sou_membro()));
create policy cg_ins on public.conhecimento_global for insert to authenticated with check ((select public.sou_membro()) and contribuinte=(select auth.uid()));
revoke select on public.conhecimento_global from authenticated, anon;
grant select (id,criado_em,tipo_componente,modo,mecanismo,causa,licao,setor,regime,desfecho,vida_h,suspensao) on public.conhecimento_global to authenticated;
grant insert (tipo_componente,modo,mecanismo,causa,licao,setor,regime,desfecho,vida_h,suspensao) on public.conhecimento_global to authenticated;

create or replace function public.vida_global(tipo text) returns json language sql stable security invoker set search_path=public as $$
  select json_build_object('tipo',tipo,'registros',count(*),'falhas',count(*) filter (where not suspensao and vida_h is not null),
    'p50_h',percentile_cont(.5) within group (order by vida_h) filter (where not suspensao),
    'p10_h',percentile_cont(.1) within group (order by vida_h) filter (where not suspensao),
    'p90_h',percentile_cont(.9) within group (order by vida_h) filter (where not suspensao),
    'vidas_h',(select json_agg(json_build_object('h',vida_h,'s',suspensao)) from (select vida_h,suspensao from public.conhecimento_global where lower(tipo_componente)=lower(tipo) and vida_h is not null order by criado_em desc limit 400) z))
  from public.conhecimento_global where lower(tipo_componente)=lower(tipo)
$$;
revoke execute on function public.vida_global(text) from anon, public; grant execute on function public.vida_global(text) to authenticated;
