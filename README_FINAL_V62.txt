HARRY'S FARM STOCK OPNAME - V62 AUDIT PCSDUS FIX

TUJUAN:
- Fix tanda merah Pcs/Dus Produk di Final Audit.
- Sebelumnya audit ikut membaca nama barang yang mengandung 1kg, 2kg, atau 500.
- Itu bisa bikin plastik/kemasan ikut dianggap Produk.
- V62 hanya mengecek kategori Produk Akhir / Produk Jadi.

FITUR:
- Semua fitur V61/V60 tetap sama.
- Banner atas tetap hilang.
- Tidak perlu SQL baru untuk fitur.
- Jalankan supabase-v62-audit-pcsdus-fix-check.sql hanya untuk cek barang Produk Akhir/Produk Jadi yang masih pcs_per_dus 0.

DEPLOY:
vercel --prod

BUKA:
https://harrys-farm-stock.vercel.app/?v=62

CATATAN:
Kalau masih merah setelah V62, berarti benar-benar ada barang kategori Produk Akhir/Produk Jadi dengan pcs_per_dus 0.
