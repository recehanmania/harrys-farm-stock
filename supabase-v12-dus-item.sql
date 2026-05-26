-- Harry's Farm V12 - Kolom Dus + Item/Pcs
-- Jalankan di Supabase SQL Editor sebelum pakai fitur dus/item.
-- 500gr = 20 pcs/dus, 1kg = 10 pcs/dus, 2kg = 5 pcs/dus.

alter table public.items
add column if not exists pcs_per_dus numeric not null default 0;

alter table public.stock_transactions
add column if not exists keluar_dus numeric not null default 0,
add column if not exists keluar_item numeric not null default 0,
add column if not exists masuk_dus numeric not null default 0,
add column if not exists masuk_item numeric not null default 0;

-- Isi otomatis pcs_per_dus untuk item yang namanya mengandung 500, 1kg, 2kg.
update public.items
set pcs_per_dus = case
  when lower(name) like '%500%' then 20
  when lower(name) like '%2 kg%' or lower(name) like '%2kg%' then 5
  when lower(name) like '%1 kg%' or lower(name) like '%1kg%' then 10
  else pcs_per_dus
end
where pcs_per_dus = 0;

-- Contoh kalau mau tambah produk kemasan:
-- insert into public.items (category, name, starting_stock, unit, min_stock, pcs_per_dus)
-- values ('Produk Jadi', 'Kentang 500gr', 0, 'pcs', 20, 20),
--        ('Produk Jadi', 'Kentang 1kg', 0, 'pcs', 10, 10),
--        ('Produk Jadi', 'Kentang 2kg', 0, 'pcs', 5, 5);
