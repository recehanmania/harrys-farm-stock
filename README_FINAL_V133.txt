V133 - GSheet Realtime Keluar Masuk + Barang Dipakai + Pemakaian Produk

Yang baru:
1. Tombol Auto GSheet ON/OFF di menu Data Stok dan Laporan.
2. Kalau Auto GSheet ON, setiap input transaksi akan otomatis mengirim update ke Google Sheet:
   - Barang Masuk
   - Keluar Pabrik
   - Barang Dipakai Hari Ini
   - Produksi + bahan yang terpotong
3. Payload GSheet sekarang membawa data:
   - keluar_masuk
   - barang_dipakai
   - pemakaian_produk
   - stok realtime
   - stok kritis
4. Apps Script terbaru: GOOGLE_APPS_SCRIPT_V133_REALTIME_KELUAR_MASUK_PEMAKAIAN.gs

Tab Google Sheet yang dibuat/diupdate:
- LOG_SYNC
- Harian_YYYY-MM-DD
- STOK_REALTIME
- TRANSAKSI_HARIAN
- KELUAR_MASUK_REALTIME
- BARANG_DIPAKAI_REALTIME
- PEMAKAIAN_PRODUK

Cara pasang Apps Script:
1. Buka Google Sheet tujuan.
2. Extensions / Ekstensi > Apps Script.
3. Hapus script lama, paste isi file GOOGLE_APPS_SCRIPT_V133_REALTIME_KELUAR_MASUK_PEMAKAIAN.gs.
4. Isi SPREADSHEET_ID kalau script tidak menempel langsung di Sheet.
5. Deploy > Manage deployments > Edit > Version: New version > Deploy.
6. Copy URL Web App /exec.
7. Di aplikasi Harry's Farm buka Data Stok atau Laporan > Set GSheet > paste URL /exec.
8. Klik Test GSheet, lalu Kirim GSheet.
9. Aktifkan Auto GSheet ON kalau LOG_SYNC sudah masuk.

Catatan penting:
- TRANSAKSI_HARIAN V133 dibuat anti dobel untuk tanggal yang sama: data tanggal itu dibersihkan lalu ditulis ulang.
- KELUAR_MASUK_REALTIME, BARANG_DIPAKAI_REALTIME, dan PEMAKAIAN_PRODUK adalah snapshot realtime hari/tanggal yang dikirim terakhir.
- Kalau Google Sheet hanya menambah LOG_SYNC TEST, berarti URL masih deployment lama. Deploy New version dan Set GSheet ulang.
