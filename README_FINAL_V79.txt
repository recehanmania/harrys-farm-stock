Harry's Farm Stock App V79 - Kategori & Lokasi Detail

Yang ditambahkan:
1. Ringkasan Lokasi Gudang / Freezer di halaman Stock Opname.
2. Filter lokasi: bisa pilih Gudang, Freezer Produk Jadi, Freezer Bahan Baku, QC, Retur, Expired, Produksi, Packing, dll.
3. Kategori tambah barang dibuat lebih detail:
   - Produk Akhir Frozen 500gr / 1kg / 2kg
   - Produk WIP / Setengah Jadi
   - Bahan Baku Kentang / Sayuran / Daging/Ikan
   - Bumbu Kering / Bumbu Cair
   - BTP / Bahan Penolong
   - Kemasan Plastik / Dus / Stiker / Lakban
   - Kebersihan, sparepart, retur, reject/QC hold, dan lainnya.
4. List stock opname dikelompokkan per lokasi lalu per kategori.
5. Export CSV sekarang ikut menyertakan area, lokasi, QC, supplier, batch/lot, dan expired.
6. Cache dinaikkan ke v=79.

Cara deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v79_kategori_lokasi_detail"
vercel --prod

Kalau tambah barang lokasi/QC tidak tersimpan, jalankan file SQL:
supabase-v79-kategori-lokasi-detail.sql
