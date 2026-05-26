-- Harry's Farm V86 - Delete Arsip Fix + RPC hapus permanen
-- Jalankan di Supabase SQL Editor kalau tombol Hapus Permanen masih gagal.
-- Fungsi ini menghapus formula + transaksi terkait dulu, lalu itemnya.

-- Permission dasar
grant select, insert, update, delete on public.items to anon, authenticated;
grant select, insert, update, delete on public.stock_transactions to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter table public.items enable row level security;
alter table public.stock_transactions enable row level security;

drop policy if exists "hf_items_delete" on public.items;
create policy "hf_items_delete" on public.items for delete using (true);

drop policy if exists "hf_tx_delete" on public.stock_transactions;
create policy "hf_tx_delete" on public.stock_transactions for delete using (true);

-- Kalau tabel formula ada, aktifkan permission delete juga.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='product_recipes') then
    execute 'grant select, insert, update, delete on public.product_recipes to anon, authenticated';
    execute 'alter table public.product_recipes enable row level security';
    execute 'drop policy if exists "hf_product_recipes_delete" on public.product_recipes';
    execute 'create policy "hf_product_recipes_delete" on public.product_recipes for delete using (true)';
  end if;
end $$;

create or replace function public.delete_item_cascade(p_item_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_tx_deleted integer := 0;
  v_recipe_deleted integer := 0;
  v_item_deleted integer := 0;
begin
  select name into v_name from public.items where id = p_item_id;
  if v_name is null then
    return jsonb_build_object('ok', false, 'message', 'Item tidak ditemukan', 'item_id', p_item_id);
  end if;

  if to_regclass('public.product_recipes') is not null then
    delete from public.product_recipes
    where product_id = p_item_id or ingredient_item_id = p_item_id;
    get diagnostics v_recipe_deleted = row_count;
  end if;

  delete from public.stock_transactions where item_id = p_item_id;
  get diagnostics v_tx_deleted = row_count;

  delete from public.items where id = p_item_id;
  get diagnostics v_item_deleted = row_count;

  return jsonb_build_object(
    'ok', true,
    'item_id', p_item_id,
    'name', v_name,
    'item_deleted', v_item_deleted,
    'transactions_deleted', v_tx_deleted,
    'recipes_deleted', v_recipe_deleted
  );
end;
$$;

grant execute on function public.delete_item_cascade(bigint) to anon, authenticated;

notify pgrst, 'reload schema';

select 'V86 delete arsip RPC OK' as status;
