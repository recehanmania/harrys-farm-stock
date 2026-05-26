-- Harry's Farm V39 - FIX Schema Keluar Dus / Keluar Pabrik
-- Jalankan di Supabase SQL Editor.
-- Ini memperbaiki error:
-- Could not find the 'keluar_dus' column of 'stock_transactions' in the schema cache

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
add column if not exists tujuan text null;

-- Isi otomatis pcs_per_dus untuk produk yang jelas ukurannya.
update public.items
set pcs_per_dus = case
  when lower(coalesce(name,'')) ~ '500\s*(gr|g)' or lower(coalesce(name,'')) like '%0.5 kg%' or lower(coalesce(name,'')) like '%0,5 kg%' then 20
  when lower(coalesce(name,'')) like '%2 kg%' or lower(coalesce(name,'')) like '%2kg%' then 5
  when lower(coalesce(name,'')) like '%1 kg%' or lower(coalesce(name,'')) like '%1kg%' then 10
  else pcs_per_dus
end
where pcs_per_dus = 0;

create index if not exists idx_items_archived on public.items (archived);
create index if not exists idx_stock_transactions_jenis_date on public.stock_transactions (jenis_transaksi, date);

-- Paksa Supabase/PostgREST baca ulang schema baru.
notify pgrst, 'reload schema';

-- CEK HASIL KOLOM:
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'stock_transactions'
  and column_name in ('keluar_dus','keluar_item','masuk_dus','masuk_item','jenis_transaksi','no_surat_jalan','tujuan')
order by column_name;
