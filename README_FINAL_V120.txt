Harry's Farm Stock Opname V120 - Resep Produksi / BOM Auto Potong

Perbaikan utama:
1. Menu Produksi diperjelas menjadi Produksi & Pakai Bahan.
2. Master Formula diganti menjadi Resep Produksi / BOM.
3. Resep/BOM bisa memilih semua bahan: bumbu, plastik, dus, bahan baku, bahan penolong.
4. Saat produksi pilih Otomatis dari Resep/BOM, sistem menghitung: hasil produksi x takaran per 1 produk.
5. Produk jadi masuk stok sebagai produksi_hasil. Bahan yang dipakai keluar stok sebagai produksi_bahan.
6. Struktur form resep diperbaiki agar tidak bentrok dengan form produksi.

Contoh:
Produksi Seasoned Wedges 100 pcs.
Resep: Plastik 1 pcs/produk, Bumbu 0.03 kg/produk.
Hasil: stok Seasoned Wedges +100 pcs, stok Plastik -100 pcs, stok Bumbu -3 kg.

Catatan Supabase:
Jika tabel product_recipes belum ada, jalankan supabase-v56-formula-resep.sql di Supabase SQL Editor.
