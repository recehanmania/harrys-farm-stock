-- Harry's Farm V20 - Arsip Tidak Hidden Total
-- Jalankan kalau kolom archived belum ada.
-- Barang archived=true tidak masuk kategori utama, tapi bisa dilihat di menu Arsip.

alter table public.items
add column if not exists archived boolean not null default false;

create index if not exists idx_items_archived
on public.items (archived);

notify pgrst, 'reload schema';

-- Pulihkan barang manual jika perlu:
-- update public.items set archived = false where name = 'NAMA BARANG';
