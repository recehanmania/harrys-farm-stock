Harry's Farm V88 - KStok 128 Item Simple

Isi update:
- Item template di aplikasi diganti pakai file: KStok HF Maret Pabrik 2026.
- Total item: 128.
- Kategori dibuat simple:
  1. Produk Akhir
  2. Bahan Baku
  3. Bahan Kemas
  4. Bahan Penolong
  5. Bahan Tambahan Pangan

Penting:
- Deploy aplikasi saja akan mengubah template Tambah Barang.
- Supaya data lama di Supabase yang terlalu banyak hilang dari tampilan, jalankan SQL:
  supabase-v88-kstok-128-item-simple.sql

SQL V88 tidak menghapus permanen item lama. Item lama hanya diarsipkan supaya riwayat transaksi tetap aman.

Cara deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v88_kstok_maret_128_item_simple"
vercel --prod

Setelah deploy:
vercel alias set LINK_PRODUCTION_BARU harrys-farm-stock.vercel.app

Buka:
https://harrys-farm-stock.vercel.app/?v=88
