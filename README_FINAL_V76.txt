HARRY'S FARM STOCK OPNAME - V76 LOKASI QC OTOMATIS

TUJUAN:
- Edit Lokasi / QC tidak lagi pakai prompt ketik manual.
- Sekarang pakai popup/pilihan otomatis:
  - Lokasi Gudang / Freezer
  - QC Status
  - Supplier
  - Batch / Lot
  - Expired Date
- Lebih mudah dipakai staff dan tidak salah ketik.

SQL:
Kalau V74 sudah dijalankan, SQL tidak wajib.
Kalau belum, jalankan:
supabase-v76-lokasi-qc-otomatis.sql

DEPLOY:
vercel --prod

BUKA:
https://harrys-farm-stock.vercel.app/?v=76
