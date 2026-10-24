-- Quem atualiza a base da planta (mapa e arquivos) é o administrador da unidade ou o master.
create or replace function public.pode_atualizar_base() returns boolean language sql stable security definer set search_path=public as $$
  select public.e_master() or public.unidade_atual() in (select public.unidades_que_administro()) $$;
revoke execute on function public.pode_atualizar_base() from anon, public; grant execute on function public.pode_atualizar_base() to authenticated;

drop policy if exists mapas_ins on storage.objects; drop policy if exists mapas_upd on storage.objects; drop policy if exists mapas_del on storage.objects;
create policy mapas_ins on storage.objects for insert to authenticated with check (bucket_id='mapas' and (storage.foldername(name))[1]=(select public.unidade_atual())::text and (select public.pode_atualizar_base()));
create policy mapas_upd on storage.objects for update to authenticated using (bucket_id='mapas' and (storage.foldername(name))[1]=(select public.unidade_atual())::text and (select public.pode_atualizar_base()));
create policy mapas_del on storage.objects for delete to authenticated using (bucket_id='mapas' and (storage.foldername(name))[1]=(select public.unidade_atual())::text and (select public.pode_atualizar_base()));

drop policy if exists arquivos_ins on public.arquivos; drop policy if exists arquivos_upd on public.arquivos; drop policy if exists arquivos_del on public.arquivos;
drop policy if exists trechos_ins on public.trechos; drop policy if exists trechos_upd on public.trechos; drop policy if exists trechos_del on public.trechos;
do $$ declare t text; begin foreach t in array array['arquivos','trechos'] loop
  execute format('create policy %1$s_ins on public.%1$s for insert to authenticated with check (unidade=(select public.unidade_atual()) and org=(select public.org_atual()) and (select public.pode_atualizar_base()))', t);
  execute format('create policy %1$s_upd on public.%1$s for update to authenticated using (unidade=(select public.unidade_atual()) and (select public.pode_atualizar_base())) with check (unidade=(select public.unidade_atual()) and org=(select public.org_atual()))', t);
  execute format('create policy %1$s_del on public.%1$s for delete to authenticated using (unidade=(select public.unidade_atual()) and (select public.pode_atualizar_base()))', t);
end loop; end $$;

-- o papel passa a dizer também se a pessoa atualiza a base da unidade atual
create or replace function public.meu_papel() returns json language sql stable security definer set search_path=public as $$
  select json_build_object('master',public.e_master(),'atualiza_base',public.pode_atualizar_base(),
    'unidades',coalesce((select json_agg(u.nome) from public.admins a join public.unidades u on u.id=a.unidade_id where a.usuario=auth.uid() and a.papel='unidade'),'[]'::json),
    'unidades_ids',coalesce((select json_agg(a.unidade_id) from public.admins a where a.usuario=auth.uid() and a.papel='unidade'),'[]'::json)) $$;

-- lista de unidades para o formulário de cadastro (master vê todas; admin vê as dele)
create or replace function public.admin_unidades() returns table(unidade_id uuid, unidade text, empresa text, dominio text, usuarios bigint) language sql stable security definer set search_path=public as $$
  select u.id, u.nome, g.nome, g.dominio, (select count(*) from public.perfis p where p.unidade_id=u.id)
  from public.unidades u join public.organizacoes g on g.id=u.org_id
  where public.e_master() or u.id in (select public.unidades_que_administro()) order by g.nome, u.nome $$;
revoke execute on function public.admin_unidades() from anon, public; grant execute on function public.admin_unidades() to authenticated;

-- tirar alguém da unidade (o admin da unidade não exclui contas; o master sim, pela função de servidor)
create or replace function public.admin_remover_da_unidade(alvo uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.admin_pode(alvo) then raise exception 'Sem permissão para este usuário'; end if;
  if exists(select 1 from public.admins where usuario=alvo and (papel='master' or (papel='unidade' and not public.e_master()))) then raise exception 'Só o master altera administradores'; end if;
  if alvo=auth.uid() then raise exception 'Você não pode remover a si mesmo'; end if;
  delete from public.admins where usuario=alvo and papel='unidade'; delete from public.perfis where usuario=alvo;
end $$;
revoke execute on function public.admin_remover_da_unidade(uuid) from anon, public; grant execute on function public.admin_remover_da_unidade(uuid) to authenticated;

-- admin de unidade não bloqueia outro admin; só o master
create or replace function public.admin_bloquear(alvo uuid, bloquear boolean, motivo text default null) returns void language plpgsql security definer set search_path=public as $$
declare em text;
begin
  if not public.admin_pode(alvo) then raise exception 'Sem permissão para este usuário'; end if;
  if exists(select 1 from public.admins where usuario=alvo and papel='master') then raise exception 'O master não pode ser bloqueado'; end if;
  if not public.e_master() and exists(select 1 from public.admins where usuario=alvo) then raise exception 'Só o master bloqueia administradores'; end if;
  if alvo=auth.uid() then raise exception 'Você não pode bloquear a si mesmo'; end if;
  select lower(email) into em from auth.users where id=alvo;
  if bloquear then insert into public.bloqueados(email,motivo) values (em,left(motivo,200)) on conflict (email) do update set motivo=excluded.motivo;
  else delete from public.bloqueados where lower(email)=em; end if;
end $$;
