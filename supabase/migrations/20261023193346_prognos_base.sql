-- Membros autorizados
create table public.membros (email text primary key, nome text, criado_em timestamptz default now());
insert into public.membros(email,nome) values ('galane33@gmail.com','Publio');
alter table public.membros enable row level security;
create or replace function public.sou_membro() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.membros where lower(email)=lower(coalesce(auth.jwt()->>'email','')))
$$;
create policy membros_self on public.membros for select to authenticated using (public.sou_membro());

-- Documentos da página (lições, análises, perfis)
create table public.docs (
  path text primary key,
  collection text not null,
  doc_id text not null,
  owner uuid default auth.uid(),
  data jsonb not null default '{}'::jsonb,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);
create index docs_collection_idx on public.docs(collection);
alter table public.docs enable row level security;

-- Arquivo técnico
create table public.arquivos (
  id bigserial primary key,
  caminho text unique not null,
  nome text, ext text, pasta text,
  tamanho bigint, modificado timestamptz,
  categoria text, status text default 'pendente',
  paginas int, caracteres int, trechos int default 0,
  resumo text, fornecedor text, documento text,
  equipamentos text[], erro text,
  processado_em timestamptz, criado_em timestamptz default now()
);
create index arquivos_status_idx on public.arquivos(status);
create index arquivos_ext_idx on public.arquivos(ext);

create table public.trechos (
  id bigserial primary key,
  arquivo_id bigint references public.arquivos(id) on delete cascade,
  ordem int, pagina int,
  texto text not null,
  tsv tsvector generated always as (to_tsvector('portuguese', coalesce(texto,''))) stored
);
create index trechos_tsv_idx on public.trechos using gin(tsv);
create index trechos_arq_idx on public.trechos(arquivo_id);

create table public.eventos (
  id bigserial primary key,
  arquivo_id bigint references public.arquivos(id) on delete set null,
  data date, tipo_evento text, equipamento text, componente text, modo text,
  texto text, fonte text, ordem_sap text, nota_sap text, chave text unique,
  criado_em timestamptz default now(),
  tsv tsvector generated always as (to_tsvector('portuguese', coalesce(equipamento,'')||' '||coalesce(componente,'')||' '||coalesce(modo,'')||' '||coalesce(texto,''))) stored
);
create index eventos_tsv_idx on public.eventos using gin(tsv);
create index eventos_data_idx on public.eventos(data);

alter table public.arquivos enable row level security;
alter table public.trechos enable row level security;
alter table public.eventos enable row level security;

-- Busca na base da planta
create or replace function public.buscar(q text, limite int default 8)
returns table(origem text, id bigint, arquivo_id bigint, caminho text, nome text, pagina int, data date, tipo_evento text, equipamento text, texto text, rank real)
language sql stable security invoker set search_path=public as $$
  with t as (select websearch_to_tsquery('portuguese', q) as tq)
  (select 'trecho', tr.id, tr.arquivo_id, a.caminho, a.nome, tr.pagina, null::date, null::text, null::text, left(tr.texto,1200), ts_rank(tr.tsv, t.tq)
     from public.trechos tr join public.arquivos a on a.id=tr.arquivo_id, t where tr.tsv @@ t.tq order by 11 desc limit limite)
  union all
  (select 'evento', e.id, e.arquivo_id, a.caminho, a.nome, null::int, e.data, e.tipo_evento, e.equipamento, left(coalesce(e.componente||': ','')||coalesce(e.texto,''),600), ts_rank(e.tsv, t.tq)
     from public.eventos e left join public.arquivos a on a.id=e.arquivo_id, t where e.tsv @@ t.tq order by 11 desc limit limite*4)
$$;

create or replace function public.resumo_base() returns json language sql stable security invoker set search_path=public as $$
  select json_build_object(
    'arquivos',(select count(*) from public.arquivos),
    'lidos',(select count(*) from public.arquivos where status='lido'),
    'trechos',(select count(*) from public.trechos),
    'eventos',(select count(*) from public.eventos),
    'bytes',(select coalesce(sum(tamanho),0) from public.arquivos))
$$;
