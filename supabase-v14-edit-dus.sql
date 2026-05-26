-- Harry's Farm V14 - Pastikan kolom dus aktif + reload schema
-- Jalankan kalau tambah dus / Pcs-Dus tidak bisa disimpan.

alter table public.items
add column if not exists pcs_per_dus numeric not null default 0;

alter table public.stock_transactions
add column if not exists keluar_dus numeric not null default 0,
add column if not exists keluar_item numeric not null default 0,
add column if not exists masuk_dus numeric not null default 0,
add column if not exists masuk_item numeric not null default 0;

-- Set otomatis dari nama barang, hanya yang masih kosong.
update public.items
set pcs_per_dus = case
  when lower(name) like '%500%' then 20
  when lower(name) like '%2 kg%' or lower(name) like '%2kg%' then 5
  when lower(name) like '%1 kg%' or lower(name) like '%1kg%' then 10
  else pcs_per_dus
end
where pcs_per_dus = 0;

-- Paksa Supabase/PostgREST baca ulang kolom baru.
notify pgrst, 'reload schema';

-- Contoh manual:
-- update public.items set pcs_per_dus = 20 where lower(name) like '%500%';
-- update public.items set pcs_per_dus = 10 where lower(name) like '%1 kg%' or lower(name) like '%1kg%';
-- update public.items set pcs_per_dus = 5 where lower(name) like '%2 kg%' or lower(name) like '%2kg%';
