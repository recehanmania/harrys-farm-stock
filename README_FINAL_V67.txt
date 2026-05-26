HARRY'S FARM STOCK OPNAME - V67 MOBILE STOCK VISIBLE

TUJUAN:
- Fix tampilan Android: menu Stok tidak perlu geser kiri-kanan.
- Di HP, tabel Stok berubah menjadi kartu per barang.
- Stok Sistem / Edit Stok langsung kelihatan jelas.
- Fisik, Min, Selisih, Status tetap ada di kartu barang.

FITUR TETAP:
- Semua fitur V66 tetap ada.
- Supabase online.
- Product image style tetap ada.
- Banner versi dan Final Audit tetap disembunyikan.

SQL:
Tidak wajib jika V60-V66 sudah jalan.
Kalau mau aman, jalankan supabase-v67-mobile-stock-visible-check.sql.

DEPLOY:
vercel --prod

BUKA:
https://harrys-farm-stock.vercel.app/?v=67

CATATAN:
Jangan deploy canvas/localStorage offline.
