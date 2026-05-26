HARRYS FARM STOCK OPNAME V84 - LAPORAN ERROR FIX

Fix utama:
1. Error menu Laporan "reportPage is not defined" sudah diperbaiki.
2. Fungsi halaman Laporan dikembalikan.
3. Fungsi halaman Arsip dikembalikan agar tidak error saat buka Arsip.
4. Menu Stok tetap simple seperti V83.

Deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v84_laporan_error_fix_simple"
vercel --prod

Set alias:
vercel alias set <production-url-baru> harrys-farm-stock.vercel.app

Buka:
https://harrys-farm-stock.vercel.app/?v=84
