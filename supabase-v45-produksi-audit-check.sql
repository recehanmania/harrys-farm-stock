-- Harry's Farm V45 - Produksi + Audit + Print
-- Tidak butuh tabel baru. Semua memakai stock_transactions.
-- Jalankan ini untuk memastikan kolom transaksi lengkap.

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

-- Jenis transaksi baru yang dipakai V45:
-- produksi_hasil: menambah stok produk jadi
-- produksi_bahan: mengurangi stok bahan yang dipakai produksi
-- audit_edit_stok: catatan edit stok manual, tidak mengubah stok
