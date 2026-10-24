-- Políticas de acesso (versão otimizada: auth.uid() e sou_membro() avaliados uma vez por consulta)
create index if not exists eventos_arquivo_idx on public.eventos(arquivo_id);

create policy docs_read on public.docs for select to authenticated using ((select public.sou_membro()) and (collection not like 'data/users/%' or collection like 'data/users/'||(select auth.uid())::text||'%'));
create policy docs_ins on public.docs for insert to authenticated with check ((select public.sou_membro()) and (collection not like 'data/users/%' or collection like 'data/users/'||(select auth.uid())::text||'%'));
create policy docs_upd on public.docs for update to authenticated using ((select public.sou_membro()) and (collection not like 'data/users/%' or collection like 'data/users/'||(select auth.uid())::text||'%'));
create policy docs_del on public.docs for delete to authenticated using ((select public.sou_membro()) and owner=(select auth.uid()));

create policy arq_all on public.arquivos for all to authenticated using ((select public.sou_membro())) with check ((select public.sou_membro()));
create policy tre_all on public.trechos for all to authenticated using ((select public.sou_membro())) with check ((select public.sou_membro()));
create policy eve_all on public.eventos for all to authenticated using ((select public.sou_membro())) with check ((select public.sou_membro()));
