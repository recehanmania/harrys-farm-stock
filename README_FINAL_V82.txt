HARRY'S FARM - V82 MENU STOK SIMPLE

Update utama:
1. Menu Stok dipisah supaya tidak terlalu penuh:
   - Ringkasan Stok
   - Pendataan / Stock Opname
   - Gudang & Freezer
   - Produksi / QC / Retur
   - Tambah Master Barang
2. Ringkasan hanya menampilkan prioritas barang kurang/habis dan ringkasan lokasi.
3. Pendataan dipakai untuk opname harian: isi stok fisik, edit stok sistem, minimum, dan cek selisih.
4. Gudang & Freezer fokus ke lokasi penyimpanan.
5. Tambah Item dipisah supaya form master barang tidak mengganggu opname harian.

Deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v82_menu_stok_simple"
vercel --prod

Buka setelah deploy:
https://harrys-farm-stock.vercel.app/?v=82

Catatan:
Tidak wajib SQL baru. Pakai SQL V81 hanya kalau master item kategori/detail lama belum dimasukkan ke Supabase.
