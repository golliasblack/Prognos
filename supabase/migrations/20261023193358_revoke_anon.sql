revoke execute on function public.sou_membro() from anon, public;
grant execute on function public.sou_membro() to authenticated;
revoke execute on function public.buscar(text,int) from anon, public;
grant execute on function public.buscar(text,int) to authenticated;
revoke execute on function public.resumo_base() from anon, public;
grant execute on function public.resumo_base() to authenticated;
