-- Harry's Farm V85 - Check policy delete item
-- Jalankan hanya kalau tombol Hapus masih gagal karena permission/RLS.

grant select, insert, update, delete on public.items to anon, authenticated;
grant select, insert, update, delete on public.stock_transactions to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter table public.items enable row level security;
alter table public.stock_transactions enable row level security;

drop policy if exists "hf_items_delete" on public.items;
create policy "hf_items_delete" on public.items for delete using (true);

drop policy if exists "hf_tx_delete" on public.stock_transactions;
create policy "hf_tx_delete" on public.stock_transactions for delete using (true);

-- Kalau tabel formula sudah ada, aktifkan permission delete juga.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='product_recipes') then
    execute 'grant select, insert, update, delete on public.product_recipes to anon, authenticated';
    execute 'alter table public.product_recipes enable row level security';
    execute 'drop policy if exists "product_recipes_delete_authenticated" on public.product_recipes';
    execute 'create policy "product_recipes_delete_authenticated" on public.product_recipes for delete using (true)';
  end if;
end $$;

notify pgrst, 'reload schema';

select 'V85 delete policy OK' as status;
