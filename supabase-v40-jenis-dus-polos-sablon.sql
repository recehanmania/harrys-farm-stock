-- Harry's Farm V40 - Jenis Dus Polos / Sablon
-- Jalankan di Supabase SQL Editor setelah V39.
-- Menambah pilihan jenis dus untuk transaksi keluar pabrik.

alter table public.stock_transactions
add column if not exists jenis_dus text null;

-- Pastikan kolom V39 tetap ada
alter table public.stock_transactions
add column if not exists keluar_dus numeric not null default 0,
add column if not exists keluar_item numeric not null default 0,
add column if not exists masuk_dus numeric not null default 0,
add column if not exists masuk_item numeric not null default 0,
add column if not exists jenis_transaksi text not null default 'stok_harian',
add column if not exists no_surat_jalan text null,
add column if not exists tujuan text null;

notify pgrst, 'reload schema';

-- Cek kolom jenis_dus:
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'stock_transactions'
  and column_name in ('jenis_dus','keluar_dus','keluar_item','no_surat_jalan','tujuan')
order by column_name;
