HARRY'S FARM STOCK OPNAME - V58 FIX FINAL STABLE

INI FIX FINAL:
- Memastikan fitur Barcode benar-benar muncul di menu Stok.
- Menu Stok sekarang ada tombol Print Barcode.
- Kode/barcode bisa diedit langsung di detail barang.
- Export Stock CSV ikut membawa kode/barcode.
- Semua fitur V57 tetap ada:
  Edit transaksi, laporan gaji, formula resep, PIN Admin, absen simple,
  cegah absen dobel, closing, backup, blok stok minus.

SQL:
- Jika V57 sudah jalan, SQL baru tidak wajib.
- Kalau barcode belum muncul di Supabase, jalankan:
  supabase-v58-fix-final-stable-check.sql

DEPLOY:
vercel --prod

CEK:
https://harrys-farm-stock.vercel.app/?v=58

TANDA BENAR:
V58 FIX FINAL STABLE AKTIF

JANGAN DEPLOY:
- canvas/localStorage offline.
