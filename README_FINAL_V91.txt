V91 - Per Kategori Simple

Yang dibenahi:
- Menu Stok dibuat per kategori besar: Produk Jadi, Bahan Baku, Bahan Penolong, Kemasan, Lainnya.
- Input Barang Keluar/Masuk sekarang pilih kategori besar dulu, jadi daftar barang tidak terlalu panjang.
- Di kartu stok ada tombol cepat: + Masuk, - Keluar, Opname.
- Stock opname lebih mudah: pilih kategori, isi stok fisik, bisa samakan stok sistem dengan fisik.
- Export Google Sheet dari V87 tetap ada.
- Data item tetap memakai KStok V88/V90, tidak menambah item banyak lagi.

Deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v91_per_kategori_simple"
vercel --prod

Buka:
https://harrys-farm-stock.vercel.app/?v=91

Catatan:
SQL baru tidak wajib. Kalau kategori lama masih aneh di database, SQL V89/V88 sebelumnya tetap bisa dipakai.
