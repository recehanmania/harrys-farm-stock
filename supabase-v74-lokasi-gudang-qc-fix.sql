-- Harry's Farm V74 - Lokasi Gudang QC Fix
-- Jalankan di Supabase SQL Editor.
-- Menambahkan field data pabrik pada master items.

alter table public.items
add column if not exists lokasi text null,
add column if not exists supplier text null,
add column if not exists qc_status text not null default 'OK',
add column if not exists batch_lot text null,
add column if not exists expired_date date null;

create index if not exists idx_items_lokasi on public.items (lokasi);
create index if not exists idx_items_qc_status on public.items (qc_status);
create index if not exists idx_items_expired_date on public.items (expired_date);

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name='items'
  and column_name in ('lokasi','supplier','qc_status','batch_lot','expired_date');
