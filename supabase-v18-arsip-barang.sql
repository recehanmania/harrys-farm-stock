-- Harry's Farm V18 - Arsip Barang
-- Jalankan di Supabase SQL Editor.
-- Barang yang archived=true tidak masuk kategori/dashboard/input/stock utama.

alter table public.items
add column if not exists archived boolean not null default false;

create index if not exists idx_items_archived
on public.items (archived);

notify pgrst, 'reload schema';
