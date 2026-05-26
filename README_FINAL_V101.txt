Harrys Farm Stock Opname V101 - Search Stok Per Kategori Fix

Yang dibenerin:
- Search barang sekarang harus pilih kategori besar dulu.
- Kalau pilih Produk Jadi, pencarian hanya cari Produk Jadi.
- Kalau pilih Bahan Baku, pencarian hanya cari Bahan Baku.
- Kalau pilih Bahan Penolong, pencarian hanya cari Bahan Penolong.
- Kalau pilih Kemasan, pencarian hanya cari Kemasan.
- Saat kategori diganti, kata pencarian otomatis dikosongkan supaya item tidak hilang sendiri.
- Tombol Reset Cari sekarang hanya bersihkan pencarian/status, kategori besar tetap tidak bikin bingung.

Deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v101_search_per_kategori_fix"
vercel --prod

Buka:
https://harrys-farm-stock.vercel.app/?v=101
