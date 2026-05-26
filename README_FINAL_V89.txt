Harry's Farm V89 - Bahan Penolong Fix

Tujuan:
Menu stok di V88 masih menampilkan APD/perlengkapan produksi sebagai QC / Produksi.
Di V89 sudah dirapikan supaya tampil sebagai Bahan Penolong.

Yang berubah:
1. Filter cepat: QC / Produksi -> Bahan Penolong.
2. Masker, Nurse Cap, Sarung Tangan Plastik, Sarung Tangan Latex, Spidol, Sabun, APD/perlengkapan produksi masuk Bahan Penolong.
3. Kartu stok menampilkan subtitle kategori asli, contoh:
   Bahan Penolong • Perlengkapan Produksi
4. Export Google Sheet harian tetap ada.
5. Master item V88 KStok 128 tetap dipakai, tidak ditambah banyak lagi.

Deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v89_bahan_penolong_fix"
vercel --prod

Setelah deploy:
vercel alias set LINK_PRODUCTION_BARU harrys-farm-stock.vercel.app

Buka:
https://harrys-farm-stock.vercel.app/?v=89

SQL opsional:
Jalankan supabase-v89-qc-produksi-jadi-bahan-penolong.sql kalau item lama di database masih category QC / Produksi.
