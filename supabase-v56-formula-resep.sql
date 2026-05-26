-- Harry's Farm V56 - Formula Resep Produksi
-- Jalankan di Supabase SQL Editor.
-- Menambah tabel master formula produk.
-- Kalau muncul warning, pilih Run and enable RLS.

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

create index if not exists idx_product_recipes_product on public.product_recipes (product_id);
create index if not exists idx_product_recipes_ingredient on public.product_recipes (ingredient_item_id);

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

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name='product_recipes'
order by ordinal_position;
