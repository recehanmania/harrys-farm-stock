-- Harry's Farm V58 - Fix Final Stable Check
-- Tidak ada tabel baru dari V57.
-- Jalankan kalau kolom barcode belum muncul atau Supabase perlu reload schema.

alter table public.items
add column if not exists barcode text null;

alter table public.stock_transactions
add column if not exists transaction_code text null,
add column if not exists no_surat_jalan text null,
add column if not exists tujuan text null,
add column if not exists jenis_dus text null,
add column if not exists jenis_plastik text null;

create index if not exists idx_items_barcode on public.items (barcode);

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name='items'
  and column_name='barcode';
