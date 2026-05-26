-- Harry's Farm V35 - cek schema Tambah Barang
-- Jalankan kalau tambah barang masih error karena kolom belum kebaca Supabase.

alter table public.items
add column if not exists archived boolean not null default false,
add column if not exists pcs_per_dus numeric not null default 0;

notify pgrst, 'reload schema';

-- Cek kolom items:
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'items'
order by ordinal_position;
