-- Harry's Farm V22 - Fix Arsip Barang
-- Jalankan di Supabase SQL Editor.
-- Barang archived=true tidak akan muncul di kategori/dashboard/input/stock utama.

alter table public.items
add column if not exists archived boolean not null default false;

create index if not exists idx_items_archived
on public.items (archived);

notify pgrst, 'reload schema';

-- Cek barang yang sedang arsip:
select id, name, category, archived
from public.items
where archived = true
order by category, name;

-- Kalau mau arsipkan manual:
-- update public.items set archived = true where name = 'NAMA BARANG';

-- Kalau mau pulihkan manual:
-- update public.items set archived = false where name = 'NAMA BARANG';
