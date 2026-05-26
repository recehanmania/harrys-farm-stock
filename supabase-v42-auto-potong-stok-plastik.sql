-- Harry's Farm V42 - Auto Potong Stok Plastik
-- Jalankan di Supabase SQL Editor setelah V41.
-- Fitur:
-- 1) Saat Keluar Pabrik, stok produk berkurang.
-- 2) Stok Kardus Polos/Sablon berkurang sesuai Keluar Dus.
-- 3) Stok Plastik berkurang sesuai total pcs produk keluar.
--    Contoh 1 dus produk 1kg = 10 pcs, maka plastik berkurang 10 pcs.

alter table public.items
add column if not exists pcs_per_dus numeric not null default 0,
add column if not exists archived boolean not null default false;

alter table public.stock_transactions
add column if not exists keluar_dus numeric not null default 0,
add column if not exists keluar_item numeric not null default 0,
add column if not exists masuk_dus numeric not null default 0,
add column if not exists masuk_item numeric not null default 0,
add column if not exists jenis_transaksi text not null default 'stok_harian',
add column if not exists no_surat_jalan text null,
add column if not exists tujuan text null,
add column if not exists jenis_dus text null,
add column if not exists jenis_plastik text null;

-- Master kardus kalau belum ada.
insert into public.items (category, name, starting_stock, unit, min_stock, physical_stock, pcs_per_dus, archived)
select 'Bahan Kemas', 'Kardus Polos', 0, 'pcs', 0, null, 0, false
where not exists (select 1 from public.items where lower(name) in ('kardus polos','dus polos'));

insert into public.items (category, name, starting_stock, unit, min_stock, physical_stock, pcs_per_dus, archived)
select 'Bahan Kemas', 'Kardus Sablon', 0, 'pcs', 0, null, 0, false
where not exists (select 1 from public.items where lower(name) in ('kardus sablon','dus sablon'));

-- Master plastik cadangan kalau belum ada. Jika sudah ada, tidak diubah.
insert into public.items (category, name, starting_stock, unit, min_stock, physical_stock, pcs_per_dus, archived)
select 'Plastik & Kemasan', 'Southmount 500 tebal', 0, 'pcs', 0, null, 0, false
where not exists (select 1 from public.items where lower(name) = 'southmount 500 tebal');

insert into public.items (category, name, starting_stock, unit, min_stock, physical_stock, pcs_per_dus, archived)
select 'Plastik & Kemasan', 'Southmount 1 kg', 0, 'pcs', 0, null, 0, false
where not exists (select 1 from public.items where lower(name) = 'southmount 1 kg');

insert into public.items (category, name, starting_stock, unit, min_stock, physical_stock, pcs_per_dus, archived)
select 'Plastik & Kemasan', 'Southmount 2 kg', 0, 'pcs', 0, null, 0, false
where not exists (select 1 from public.items where lower(name) = 'southmount 2 kg');

insert into public.items (category, name, starting_stock, unit, min_stock, physical_stock, pcs_per_dus, archived)
select 'Plastik & Kemasan', 'HF 1 kg / 2 kg', 0, 'pcs', 0, null, 0, false
where not exists (select 1 from public.items where lower(name) = 'hf 1 kg / 2 kg');

insert into public.items (category, name, starting_stock, unit, min_stock, physical_stock, pcs_per_dus, archived)
select 'Plastik & Kemasan', 'Polos 1 kg / 2 kg', 0, 'pcs', 0, null, 0, false
where not exists (select 1 from public.items where lower(name) = 'polos 1 kg / 2 kg');

insert into public.items (category, name, starting_stock, unit, min_stock, physical_stock, pcs_per_dus, archived)
select 'Plastik & Kemasan', 'Plastik HF Baru 1 kg', 0, 'pcs', 0, null, 0, false
where not exists (select 1 from public.items where lower(name) = 'plastik hf baru 1 kg');

create index if not exists idx_items_archived on public.items (archived);
create index if not exists idx_stock_transactions_jenis_date on public.stock_transactions (jenis_transaksi, date);

notify pgrst, 'reload schema';

-- Cek master plastik:
select id, category, name, starting_stock, unit, min_stock
from public.items
where lower(category) like '%plastik%'
   or lower(name) like '%plastik%'
   or lower(name) like '%southmount%'
   or lower(name) like '%polos%'
   or lower(name) like '%hf%'
order by name;
