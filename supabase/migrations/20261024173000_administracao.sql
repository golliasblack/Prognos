-- Administração: master vê e gerencia todos; admin de unidade gerencia só a própria unidade.
-- O primeiro master é definido pelo dono do projeto no SQL Editor (ver README da pasta supabase).
create table public.admins (usuario uuid primary key references auth.users(id) on delete cascade, papel text not null check (papel in ('master','unidade')), unidade_id uuid references public.unidades(id) on delete cascade, criado_em timestamptz default now(),
  check (papel='master' or unidade_id is not null));
alter table public.admins enable row level security;
create table public.master_emails (email text primary key);
alter table public.master_emails enable row level security;
create or replace function public.admin_auto() returns trigger language plpgsql security definer set search_path=public as $$
begin if exists(select 1 from public.master_emails where email=lower(new.email)) then insert into public.admins(usuario,papel) values (new.id,'master') on conflict do nothing; end if; return new; end $$;
create trigger admin_auto after insert on auth.users for each row execute function public.admin_auto();
revoke execute on function public.admin_auto() from anon, authenticated, public;

create or replace function public.e_master() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.admins where usuario=auth.uid() and papel='master') $$;
create or replace function public.unidades_que_administro() returns setof uuid language sql stable security definer set search_path=public as $$
  select unidade_id from public.admins where usuario=auth.uid() and papel='unidade' $$;
create or replace function public.meu_papel() returns json language sql stable security definer set search_path=public as $$
  select json_build_object('master',public.e_master(),'unidades',coalesce((select json_agg(u.nome) from public.admins a join public.unidades u on u.id=a.unidade_id where a.usuario=auth.uid() and a.papel='unidade'),'[]'::json)) $$;

create or replace function public.admin_usuarios(busca text default null) returns table(usuario uuid, email text, nome text, empresa text, dominio text, unidade text, unidade_id uuid, criado_em timestamptz, ultimo_acesso timestamptz, confirmado boolean, uso_hoje int, uso_30d int, bloqueado boolean, papel text)
language sql stable security definer set search_path=public as $$
  select u.id, u.email::text, p.nome, g.nome, g.dominio, n.nome, n.id, u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null,
    coalesce((select chamadas from public.uso_ia x where x.dono=u.id and x.dia=current_date),0),
    coalesce((select sum(chamadas)::int from public.uso_ia x where x.dono=u.id and x.dia>current_date-30),0),
    exists(select 1 from public.bloqueados b where lower(b.email)=lower(u.email)),
    (select string_agg(case when a.papel='master' then 'master' else 'admin da unidade' end, ', ') from public.admins a where a.usuario=u.id)
  from auth.users u left join public.perfis p on p.usuario=u.id left join public.organizacoes g on g.id=p.org_id left join public.unidades n on n.id=p.unidade_id
  where (public.e_master() or p.unidade_id in (select public.unidades_que_administro()))
    and (busca is null or busca='' or u.email ilike '%'||busca||'%' or p.nome ilike '%'||busca||'%' or g.nome ilike '%'||busca||'%' or n.nome ilike '%'||busca||'%')
  order by u.created_at desc limit 500 $$;

create or replace function public.admin_resumo() returns json language sql stable security definer set search_path=public as $$
  select case when public.e_master() then json_build_object(
    'usuarios',(select count(*) from auth.users),'confirmados',(select count(*) from auth.users where email_confirmed_at is not null),
    'empresas',(select count(*) from public.organizacoes where dominio is not null),'unidades',(select count(*) from public.unidades),
    'ativos_7d',(select count(*) from auth.users where last_sign_in_at>now()-interval '7 days'),
    'ia_hoje',(select coalesce(sum(chamadas),0) from public.uso_ia where dia=current_date),'rede',(select count(*) from public.conhecimento_global),
    'eventos',(select count(*) from public.eventos),'bloqueados',(select count(*) from public.bloqueados))
  when exists(select public.unidades_que_administro()) then json_build_object('usuarios',(select count(*) from public.perfis where unidade_id in (select public.unidades_que_administro())),
    'ia_hoje',(select coalesce(sum(x.chamadas),0) from public.uso_ia x join public.perfis p on p.usuario=x.dono where x.dia=current_date and p.unidade_id in (select public.unidades_que_administro())),
    'eventos',(select count(*) from public.eventos where unidade in (select public.unidades_que_administro()))) end $$;

create or replace function public.admin_pode(alvo uuid) returns boolean language sql stable security definer set search_path=public as $$
  select public.e_master() or exists(select 1 from public.perfis p where p.usuario=alvo and p.unidade_id in (select public.unidades_que_administro())) $$;

create or replace function public.admin_bloquear(alvo uuid, bloquear boolean, motivo text default null) returns void language plpgsql security definer set search_path=public as $$
declare em text;
begin
  if not public.admin_pode(alvo) then raise exception 'Sem permissão para este usuário'; end if;
  if exists(select 1 from public.admins where usuario=alvo and papel='master') then raise exception 'O master não pode ser bloqueado'; end if;
  if alvo=auth.uid() then raise exception 'Você não pode bloquear a si mesmo'; end if;
  select lower(email) into em from auth.users where id=alvo;
  if bloquear then insert into public.bloqueados(email,motivo) values (em,left(motivo,200)) on conflict (email) do update set motivo=excluded.motivo;
  else delete from public.bloqueados where lower(email)=em; end if;
end $$;

create or replace function public.admin_definir_admin_unidade(alvo uuid, ativo boolean) returns void language plpgsql security definer set search_path=public as $$
declare un uuid;
begin
  if not public.e_master() then raise exception 'Só o master define administradores'; end if;
  select unidade_id into un from public.perfis where usuario=alvo;
  if un is null then raise exception 'O usuário ainda não informou a unidade'; end if;
  if ativo then insert into public.admins(usuario,papel,unidade_id) values (alvo,'unidade',un) on conflict (usuario) do update set unidade_id=excluded.unidade_id where public.admins.papel<>'master';
  else delete from public.admins where usuario=alvo and papel='unidade'; end if;
end $$;

revoke execute on function public.e_master(), public.unidades_que_administro(), public.meu_papel(), public.admin_usuarios(text), public.admin_resumo(), public.admin_pode(uuid), public.admin_bloquear(uuid,boolean,text), public.admin_definir_admin_unidade(uuid,boolean) from anon, public;
grant execute on function public.e_master(), public.unidades_que_administro(), public.meu_papel(), public.admin_usuarios(text), public.admin_resumo(), public.admin_pode(uuid), public.admin_bloquear(uuid,boolean,text), public.admin_definir_admin_unidade(uuid,boolean) to authenticated;
-- Para definir o master (rodar uma vez no SQL Editor, com o seu e-mail):
-- insert into master_emails values ('seu@email.com');
-- insert into admins(usuario,papel) select id,'master' from auth.users where lower(email) in (select email from master_emails) on conflict do nothing;
