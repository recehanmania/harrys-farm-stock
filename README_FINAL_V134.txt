V134 - Input Simple Keluar / Masuk / Barang Dipakai

Yang sudah di-fix:
1. Menu Input sekarang jadi "Keluar / Masuk".
2. Dalam 1 menu ada 3 tombol besar:
   - Barang Masuk: stok bertambah.
   - Barang Keluar: stok berkurang untuk rusak, sample, retur, pindah gudang, kebutuhan non-produksi.
   - Barang Dipakai: stok bahan/bumbu/kemasan berkurang untuk pemakaian produksi harian.
3. Form dibuat simple:
   pilih jenis transaksi -> pilih kategori -> pilih barang -> isi jumlah -> simpan.
4. Barang Dipakai otomatis masuk jenis transaksi barang_dipakai_hari_ini dan tetap masuk rekap Google Sheet realtime.
5. Barang Keluar umum sudah dibuka lagi, tapi tetap diblok kalau stok tidak cukup supaya stok tidak minus.
6. Di Data Stok card barang sekarang ada tombol cepat:
   + Masuk, - Keluar, Pakai, dan Opname.
7. Dashboard shortcut Barang Dipakai sekarang langsung masuk ke form simple mode Dipakai.
8. Rekomendasi alur ditambahkan di samping form supaya staff tidak bingung.

Rekomendasi pemakaian harian:
- Barang datang / pembelian: menu Keluar-Masuk -> Barang Masuk.
- Barang rusak, sample, retur supplier, pindah gudang: menu Keluar-Masuk -> Barang Keluar.
- Bumbu, kentang, plastik, dus, tepung, bahan yang dipakai produksi hari ini: menu Keluar-Masuk -> Barang Dipakai.
- Kirim produk jadi ke customer/pabrik pakai dus: tetap gunakan menu Pabrik, karena sistem bisa potong produk, dus, dan plastik otomatis.
- Produksi dengan hasil masuk stok + bahan detail/BOM: tetap gunakan menu Produksi.

Google Sheet:
- Apps Script V133 masih bisa dipakai.
- Data barang_masuk, barang_keluar, dan barang_dipakai_hari_ini masuk ke TRANSAKSI_HARIAN dan KELUAR_MASUK_REALTIME.
- Barang Dipakai juga masuk ke BARANG_DIPAKAI_REALTIME.

Catatan:
- Tidak perlu SQL baru untuk fitur simple ini jika tabel stock_transactions sudah jalan dari V133.
- Kalau kolom tambahan Supabase belum aktif, aplikasi tetap punya fallback mode basic seperti versi sebelumnya.
