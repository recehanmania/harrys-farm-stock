Harry's Farm Stock Opname
V90 - Tampil Semua Item Fix

Perubahan:
- Cek Stok sekarang menampilkan semua item sesuai filter, bukan hanya beberapa barang perlu cek.
- Tombol Total Item / Tampilkan Semua mereset filter supaya 120 item KStok bisa terlihat.
- Filter Bahan Penolong tetap dipakai dari V89.
- Export Google Sheet harian tetap ada.
- Tidak perlu SQL baru, tetap pakai SQL V88/V89 kalau data lama belum rapi.

Deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v90_tampil_semua_item_simple"
vercel --prod

Buka:
https://harrys-farm-stock.vercel.app/?v=90
