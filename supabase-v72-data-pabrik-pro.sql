-- Harry's Farm V72 - Data Pabrik Pro
-- Jalankan di Supabase SQL Editor.
-- Menambah data pabrik: kode barang, lokasi, supplier, QC, batch, expired, alasan edit, dan VOID transaksi.
-- Tidak menghapus data lama.

alter table public.items
add column if not exists item_code text null,
add column if not exists location text null,
add column if not exists supplier text null,
add column if not exists qc_status text not null default 'OK',
add column if not exists batch_lot text null,
add column if not exists expired_date date null;

alter table public.stock_transactions
add column if not exists edit_reason text null,
add column if not exists voided boolean not null default false,
add column if not exists void_reason text null,
add column if not exists voided_at timestamptz null,
add column if not exists voided_by text null;

create index if not exists idx_items_item_code on public.items (item_code);
create index if not exists idx_items_location on public.items (location);
create index if not exists idx_items_qc_status on public.items (qc_status);
create index if not exists idx_items_expired_date on public.items (expired_date);
create index if not exists idx_stock_transactions_voided on public.stock_transactions (voided);

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name in ('items','stock_transactions')
  and column_name in ('item_code','location','supplier','qc_status','batch_lot','expired_date','edit_reason','voided','void_reason','voided_at','voided_by')
order by table_name, column_name;
