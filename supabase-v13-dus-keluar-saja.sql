-- Harry's Farm V13 - Dus hanya untuk barang keluar
-- Jalankan di Supabase SQL Editor kalau belum pernah menjalankan V12.
-- Kolom masuk_dus tetap dibuat 0 untuk kompatibilitas, tapi aplikasi V13 tidak memakai masuk dus.

alter table public.items
add column if not exists pcs_per_dus numeric not null default 0;

alter table public.stock_transactions
add column if not exists keluar_dus numeric not null default 0,
add column if not exists keluar_item numeric not null default 0,
add column if not exists masuk_dus numeric not null default 0,
add column if not exists masuk_item numeric not null default 0;

update public.items
set pcs_per_dus = case
  when lower(name) like '%500%' then 20
  when lower(name) like '%2 kg%' or lower(name) like '%2kg%' then 5
  when lower(name) like '%1 kg%' or lower(name) like '%1kg%' then 10
  else pcs_per_dus
end
where pcs_per_dus = 0;
