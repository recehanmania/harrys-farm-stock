Harry's Farm Stock Opname V97 - V91 Per Kategori + Batas Minimum

Fix:
- Tetap pakai alur V91 per kategori.
- Batas Minimum sekarang tampil jelas di kartu barang: Stok + Min + Status.
- Minimum bisa diedit langsung di kartu barang.
- Tombol + Masuk, - Keluar, dan Opname ikut menanyakan batas minimum.
- Kalau data lama min_stock masih 0/kosong, app pakai default minimum sesuai kategori.

Deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v97_v91_minimum_simple"
vercel --prod

Buka:
https://harrys-farm-stock.vercel.app/?v=97

SQL opsional:
Jalankan supabase-v97-batas-minimum-v91.sql kalau ingin minimum default tersimpan permanen di Supabase.
