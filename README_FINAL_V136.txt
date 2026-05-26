Harry's Farm Stock Opname - V136 Laporan Simple Staff

FIX UTAMA:
1. Menu Laporan dibuat lebih mudah dipahami staff.
2. Ada filter cepat:
   - Semua
   - Barang Masuk
   - Produksi / Dipakai
   - Barang Keluar
   - Opname / Koreksi
3. Export CSV, Print Filter, dan Kirim GSheet mengikuti filter laporan aktif.
4. Label jenis transaksi dibuat bahasa manusia, bukan kode database.
5. Search laporan tetap bisa cari barang, SJ/DO, tujuan, plastik, petugas, dan kode transaksi.

REKOMENDASI ALUR LAPORAN:
- Admin cek Barang Masuk untuk barang datang: dus, plastik, bumbu, kentang, bahan baku.
- Admin cek Produksi / Dipakai untuk bahan yang kepotong produksi hari ini.
- Admin cek Barang Keluar untuk produk akhir, dus/plastik keluar, sample, rusak, retur, pindah gudang.
- Admin cek Opname / Koreksi untuk stock opname dan audit edit stok.

CATATAN:
GSheet realtime tetap memakai Apps Script V133. Kalau sudah jalan di V133/V135, tidak perlu ganti Apps Script.
