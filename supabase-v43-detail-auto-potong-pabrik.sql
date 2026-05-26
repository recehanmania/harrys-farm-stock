-- Harry's Farm V43 - Detail Auto Potong Pabrik
-- Tidak menambah kolom baru dari V42.
-- Jalankan ini kalau belum menjalankan V42 atau schema belum lengkap.

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
add column if not exists tujuan text null,
add column if not exists jenis_dus text null,
add column if not exists jenis_plastik text null;

notify pgrst, 'reload schema';
