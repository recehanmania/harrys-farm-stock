HARRYS FARM STOCK OPNAME - V142 FIX TOMBOL SIMPAN PRODUKSI

Perbaikan dari V140:
- Tombol Simpan Produksi Hari Ini sekarang bisa diklik dan tersubmit normal.
- Bug utama: field Resep/BOM di panel admin sebelumnya ikut validasi form produksi walaupun panel tertutup, sehingga tombol simpan terlihat seperti tidak bisa dipencet.
- Field Resep/BOM dipisahkan validasinya: hanya dicek saat klik Simpan Resep.
- Saat simpan produksi, tombol berubah menjadi "Menyimpan produksi..." supaya staff tahu proses berjalan.
- Tampilan/card tetap mengikuti V140/V139, tidak diubah total.
- GSheet realtime tetap pakai Apps Script V133.

Alur staff:
1. Produk dibuat pilih di Produksi Hari Ini.
2. Isi jumlah hasil jadi.
3. Pilih bahan/bumbu/plastik/dus yang dipakai.
4. Klik Simpan Produksi Hari Ini.
