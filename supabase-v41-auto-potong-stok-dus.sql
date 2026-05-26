-- Harry's Farm V41 - Auto Potong Stok Dus Polos / Sablon
-- Jalankan di Supabase SQL Editor.
-- Fitur:
-- 1) Jenis Dus Polos/Sablon aktif.
-- 2) Master item Kardus Polos dan Kardus Sablon dibuat otomatis kalau belum ada.
-- 3) Saat Keluar Pabrik, sistem potong stok produk dan stok Kardus sesuai Keluar Dus.

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
add column if not exists jenis_dus text null;

-- Buat master item Kardus Polos kalau belum ada.
insert into public.items (category, name, starting_stock, unit, min_stock, physical_stock, pcs_per_dus, archived)
select 'Bahan Kemas', 'Kardus Polos', 0, 'pcs', 0, null, 0, false
where not exists (
  select 1 from public.items
  where lower(name) in ('kardus polos','dus polos')
);

-- Buat master item Kardus Sablon kalau belum ada.
insert into public.items (category, name, starting_stock, unit, min_stock, physical_stock, pcs_per_dus, archived)
select 'Bahan Kemas', 'Kardus Sablon', 0, 'pcs', 0, null, 0, false
where not exists (
  select 1 from public.items
  where lower(name) in ('kardus sablon','dus sablon')
);

create index if not exists idx_items_archived on public.items (archived);
create index if not exists idx_stock_transactions_jenis_date on public.stock_transactions (jenis_transaksi, date);

notify pgrst, 'reload schema';

-- Cek master dus:
select id, category, name, starting_stock, unit, min_stock
from public.items
where lower(name) like '%kardus%' or lower(name) like '%dus%'
order by name;
