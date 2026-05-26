-- Harry's Farm V16 - Barang keluar dari pabrik per dus
-- Jalankan di Supabase SQL Editor sebelum upload/pakai V16.
-- Fitur ini menambah kolom jenis transaksi, tujuan, dan nomor surat jalan.

alter table public.stock_transactions
add column if not exists jenis_transaksi text not null default 'stok_harian',
add column if not exists tujuan text null,
add column if not exists no_surat_jalan text null;

-- Pastikan kolom dus/item tetap ada.
alter table public.items
add column if not exists pcs_per_dus numeric not null default 0;

alter table public.stock_transactions
add column if not exists keluar_dus numeric not null default 0,
add column if not exists keluar_item numeric not null default 0,
add column if not exists masuk_dus numeric not null default 0,
add column if not exists masuk_item numeric not null default 0;

-- Isi otomatis pcs_per_dus untuk produk yang namanya jelas.
update public.items
set pcs_per_dus = case
  when lower(name) like '%500%' then 20
  when lower(name) like '%2 kg%' or lower(name) like '%2kg%' then 5
  when lower(name) like '%1 kg%' or lower(name) like '%1kg%' then 10
  else pcs_per_dus
end
where pcs_per_dus = 0;

create index if not exists idx_stock_transactions_jenis_date
on public.stock_transactions (jenis_transaksi, date);

notify pgrst, 'reload schema';
