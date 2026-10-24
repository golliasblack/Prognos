-- Funções usadas só pela função de servidor "admin" (chave de serviço), nunca pelo navegador.
create or replace function public.srv_id_por_email(e text) returns uuid language sql stable security definer set search_path=public as $$ select id from auth.users where lower(email)=lower(e) $$;
create or replace function public.srv_resolver_unidade(empresa text, unidade text, email text) returns uuid language plpgsql security definer set search_path=public as $$
declare dom text := lower(split_part(email,'@',2)); o uuid; u uuid;
begin
  if not public.dominio_publico(dom) then select id into o from public.organizacoes where dominio=dom; end if;
  if o is null then select id into o from public.organizacoes where lower(nome)=lower(trim(empresa)) order by (dominio is null), criado_em limit 1; end if;
  if o is null then insert into public.organizacoes(nome,dominio) values (trim(empresa), case when public.dominio_publico(dom) then null else dom end) returning id into o; end if;
  select id into u from public.unidades where org_id=o and lower(nome)=lower(trim(unidade));
  if u is null then insert into public.unidades(org_id,nome) values (o,trim(unidade)) returning id into u; end if;
  return u;
end $$;
create or replace function public.srv_vincular(alvo uuid, unidade uuid, nome text, admin_unidade boolean) returns void language plpgsql security definer set search_path=public as $$
declare o uuid;
begin
  select org_id into o from public.unidades where id=unidade; if o is null then raise exception 'unidade inexistente'; end if;
  insert into public.perfis as p (usuario,org_id,unidade_id,nome) values (alvo,o,unidade,nullif(trim(nome),''))
    on conflict (usuario) do update set org_id=excluded.org_id, unidade_id=excluded.unidade_id, nome=coalesce(excluded.nome,p.nome), atualizado_em=now();
  if admin_unidade then insert into public.admins(usuario,papel,unidade_id) values (alvo,'unidade',unidade) on conflict (usuario) do update set unidade_id=excluded.unidade_id where public.admins.papel<>'master'; end if;
end $$;
create or replace function public.srv_e_master(alvo uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.admins where usuario=alvo and papel='master') $$;
revoke execute on function public.srv_id_por_email(text), public.srv_resolver_unidade(text,text,text), public.srv_vincular(uuid,uuid,text,boolean), public.srv_e_master(uuid) from anon, authenticated, public;
grant execute on function public.srv_id_por_email(text), public.srv_resolver_unidade(text,text,text), public.srv_vincular(uuid,uuid,text,boolean), public.srv_e_master(uuid) to service_role;
