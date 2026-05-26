HARRYS FARM STOCK OPNAME V83 - STOK SUPER SIMPLE

Perubahan utama:
1. Menu stok hanya 3 agar tidak rumit:
   - Cek Stok
   - Opname
   - Tambah Barang
2. Filter gudang/freezer/kategori dibuat sederhana pakai chip:
   Semua, Produk Jadi, Bahan Baku, Kemasan, QC/Produksi, Lainnya.
3. Kartu stok dipendekkan.
   Detail lokasi, QC, barcode, kemasan, pcs/dus masuk ke tombol Detail.
4. Form Tambah Barang dibuat simple.
   Detail seperti varian, supplier, QC, batch, expired masuk ke bagian opsional.

Deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v83_stok_super_simple"
vercel --prod

Buka:
https://harrys-farm-stock.vercel.app/?v=83

SQL baru tidak wajib. Tetap pakai SQL V81 jika master item detail belum masuk.
