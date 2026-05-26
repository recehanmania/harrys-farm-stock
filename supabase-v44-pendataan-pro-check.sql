-- Harry's Farm V44 - Pendataan Pro Check
-- Tidak wajib kalau V42/V43 sudah jalan.
-- Jalankan untuk memastikan semua kolom pendataan pabrik aktif.

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

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name='stock_transactions'
order by ordinal_position;
