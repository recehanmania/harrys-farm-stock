-- Harry's Farm V70 - Jam Transaksi POS
-- Jalankan di Supabase SQL Editor supaya menu keluar/masuk barang menyimpan jam transaksi.
-- Tidak menghapus data lama.

alter table public.stock_transactions
add column if not exists jam_transaksi time null;

create index if not exists idx_stock_transactions_date_time
on public.stock_transactions (date, jam_transaksi);

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name='stock_transactions'
  and column_name='jam_transaksi';
