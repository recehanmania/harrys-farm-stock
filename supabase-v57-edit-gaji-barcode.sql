-- Harry's Farm V57 - Edit Transaksi + Laporan Gaji + Barcode Ready
-- Jalankan di Supabase SQL Editor.
-- Jika V56 sudah jalan, ini hanya menambah kolom barcode di items dan memastikan schema pendukung aktif.

alter table public.items
add column if not exists barcode text null;

alter table public.stock_transactions
add column if not exists transaction_code text null,
add column if not exists no_surat_jalan text null,
add column if not exists tujuan text null,
add column if not exists jenis_dus text null,
add column if not exists jenis_plastik text null;

create table if not exists public.product_recipes (
  id bigserial primary key,
  product_id bigint not null,
  ingredient_item_id bigint not null,
  ingredient_name text null,
  qty_per_unit numeric not null default 0,
  unit text null,
  note text null,
  created_by uuid null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.product_recipes enable row level security;

drop policy if exists "product_recipes_select_authenticated" on public.product_recipes;
create policy "product_recipes_select_authenticated"
on public.product_recipes for select to authenticated using (true);

drop policy if exists "product_recipes_insert_authenticated" on public.product_recipes;
create policy "product_recipes_insert_authenticated"
on public.product_recipes for insert to authenticated with check (true);

drop policy if exists "product_recipes_update_authenticated" on public.product_recipes;
create policy "product_recipes_update_authenticated"
on public.product_recipes for update to authenticated using (true) with check (true);

drop policy if exists "product_recipes_delete_authenticated" on public.product_recipes;
create policy "product_recipes_delete_authenticated"
on public.product_recipes for delete to authenticated using (true);

create index if not exists idx_items_barcode on public.items (barcode);
create index if not exists idx_product_recipes_product on public.product_recipes (product_id);

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name='items'
  and column_name='barcode';
