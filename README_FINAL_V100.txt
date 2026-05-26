Harry's Farm Stock Opname V100 - Stock Final Check

Fix bagian Stok:
- Daftar barang benar-benar dipisah per kategori besar: Produk Jadi, Bahan Baku, Bahan Penolong, Kemasan, Lainnya.
- Search tetap jalan per kategori.
- Reset Cari sekarang membersihkan search, kategori, status, lokasi, dan kategori besar.
- Klik kategori besar otomatis reset kategori detail supaya item tidak hilang karena filter bentrok.
- Card stok tetap menampilkan Stok, Min, Status, Fisik, dan tombol + Masuk / - Keluar / Opname.
- Status card tetap tegas: HABIS merah, DI BAWAH MINIMUM kuning, AMAN hijau.
- Fix input Edit Stok Sistem agar tidak rusak oleh format angka ribuan.

Deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v100_stock_final_check"
vercel --prod

Buka:
https://harrys-farm-stock.vercel.app/?v=100
