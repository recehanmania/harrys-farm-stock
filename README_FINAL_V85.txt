Harry's Farm V85 - Hapus Item Fix

Perbaikan:
1. Tombol Hapus ditambahkan di Detail barang pada menu Stok.
2. Tombol Hapus Permanen ditambahkan di menu Arsip.
3. Sistem menghapus data formula dan transaksi terkait sebelum menghapus item, supaya item yang pernah dipakai tetap bisa dihapus bila admin benar-benar mau.
4. Tetap disarankan pakai Arsipkan kalau barang lama hanya tidak dipakai lagi, supaya laporan lama tidak hilang.

Deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v85_hapus_item_fix"
vercel --prod

Buka:
https://harrys-farm-stock.vercel.app/?v=85
