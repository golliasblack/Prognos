create or replace function public.definir_organizacao(empresa text, unidade text, nome text default null) returns json language plpgsql security definer set search_path=public as $$
#variable_conflict use_column
declare em text := lower(coalesce(auth.jwt()->>'email','')); dom text := split_part(em,'@',2); o uuid; u uuid;
  emp text := nullif(trim(definir_organizacao.empresa),''); uni text := nullif(trim(definir_organizacao.unidade),''); nm text := nullif(trim(definir_organizacao.nome),'');
begin
  if auth.uid() is null then raise exception 'sem sessão'; end if;
  if emp is null or uni is null then raise exception 'Informe a empresa e a unidade'; end if;
  if length(emp)>120 or length(uni)>120 then raise exception 'Nome muito longo'; end if;
  if public.dominio_publico(dom) then
    select p.org_id into o from public.perfis p join public.organizacoes g on g.id=p.org_id where p.usuario=auth.uid() and g.dominio is null;
    if o is null then insert into public.organizacoes(nome,dominio) values (emp,null) returning id into o; else update public.organizacoes g set nome=emp where g.id=o; end if;
  else
    select g.id into o from public.organizacoes g where g.dominio=dom;
    if o is null then insert into public.organizacoes(nome,dominio) values (emp,dom) returning id into o; end if;
  end if;
  select x.id into u from public.unidades x where x.org_id=o and lower(x.nome)=lower(uni);
  if u is null then insert into public.unidades(org_id,nome) values (o,uni) returning id into u; end if;
  insert into public.perfis as p (usuario,org_id,unidade_id,nome) values (auth.uid(),o,u,nm)
    on conflict (usuario) do update set org_id=excluded.org_id, unidade_id=excluded.unidade_id, nome=coalesce(excluded.nome,p.nome), atualizado_em=now();
  return public.meu_perfil();
end $$;
