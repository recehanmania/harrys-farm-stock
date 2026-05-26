HARRY'S FARM STOCK OPNAME - V74 LOKASI GUDANG QC FIX

TUJUAN:
- Memperjelas data pabrik di menu Stok Barang.
- Ada pilihan Lokasi Gudang / Freezer.
- Ada status QC: OK, HOLD, REJECT, EXPIRED, RETUR.
- Ada Supplier, Batch/Lot, dan Expired Date.
- Ada tombol Edit Lokasi / QC di detail barang.
- Cocok untuk membedakan stok siap pakai, barang hold, reject, retur, dan expired.

PILIHAN LOKASI:
- Gudang Bahan Baku
- Gudang Bahan Tambahan Pangan
- Gudang Bahan Kemas
- Gudang Packaging
- Freezer Produk Jadi
- Freezer Bahan Baku
- Area Produksi
- Barang Hold QC
- Barang Reject
- Barang Retur
- Barang Expired

SQL:
Wajib jalankan:
supabase-v74-lokasi-gudang-qc-fix.sql

DEPLOY:
vercel --prod

BUKA:
https://harrys-farm-stock.vercel.app/?v=74
