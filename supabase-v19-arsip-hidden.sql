-- Harry's Farm V19 - Arsip Hidden
-- Jalankan kalau kolom archived belum ada.
-- Barang archived=true akan disembunyikan oleh aplikasi V19.

alter table public.items
add column if not exists archived boolean not null default false;

create index if not exists idx_items_archived
on public.items (archived);

notify pgrst, 'reload schema';

-- Kalau ingin memulihkan barang secara manual dari Supabase:
-- update public.items set archived = false where name = 'NAMA BARANG';
