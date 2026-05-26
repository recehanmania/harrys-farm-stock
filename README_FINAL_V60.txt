HARRY'S FARM STOCK OPNAME - V60 FIXED FINAL

INI VERSI FINAL FIXED YANG DIPAKAI.

BASIS:
- Dibuat dari V59 Supabase final.
- Bukan canvas/localStorage offline.

FITUR FINAL:
- Home elegan + Final Audit
- Stok Opname online Supabase
- Barcode / Print Barcode
- Input Harian
- Produksi
- Master Formula Produk
- Keluar Pabrik auto potong produk/dus/plastik
- Absen Simple
- Cegah absen dobel
- Edit absen
- Laporan gaji sederhana
- Edit transaksi
- Closing harian
- Backup JSON + Backup Bulanan
- Blok stok minus
- PIN Admin
- SQL gabungan semua fitur

SQL:
Jalankan jika ingin memastikan schema lengkap:
supabase-v60-fixed-final.sql

DEPLOY:
vercel --prod

ALIAS:
vercel alias set LINK_PRODUCTION_TERBARU harrys-farm-stock.vercel.app

CEK:
https://harrys-farm-stock.vercel.app/?v=60

TANDA BENAR:
V60 FIXED FINAL AKTIF

JANGAN:
- Jangan deploy canvas/localStorage offline.
- Jangan paste kode React ke Supabase SQL.
- Jangan pakai folder versi lama setelah V60.
