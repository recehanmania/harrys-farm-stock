HARRY'S FARM STOCK OPNAME - V72 DATA PABRIK PRO

TUJUAN:
- Data pabrik lebih rapi dan aman untuk audit.
- Menu Stok punya kode barang, lokasi, supplier, QC status, batch/lot, dan expired date.
- Edit stok manual wajib isi alasan.
- Hapus transaksi diganti VOID dengan alasan, jadi data tidak hilang permanen.
- Transaksi VOID tidak mempengaruhi stok.

FITUR BARU:
- Kode barang / item code.
- Lokasi gudang/freezer.
- Supplier.
- QC status: OK / HOLD / REJECT / EXPIRED / RETUR.
- Batch / Lot.
- Expired date.
- Alasan edit stok wajib.
- Void transaksi pakai alasan.

SQL WAJIB:
supabase-v72-data-pabrik-pro.sql

DEPLOY:
vercel --prod

BUKA:
https://harrys-farm-stock.vercel.app/?v=72

CATATAN:
Jangan deploy canvas/localStorage offline.
