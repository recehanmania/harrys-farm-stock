CARA GUNAKAN GSHEET REALTIME V133

1. Pakai Apps Script terbaru:
   GOOGLE_APPS_SCRIPT_V133_REALTIME_KELUAR_MASUK_PEMAKAIAN.gs

2. Deploy sebagai Web App:
   - Execute as: Me / Saya
   - Who has access: Anyone / Siapa saja
   - Copy URL yang berakhiran /exec

3. Di aplikasi:
   - Buka Data Stok atau Laporan
   - Klik Set GSheet
   - Paste URL /exec
   - Klik Test GSheet
   - Klik Kirim GSheet pertama kali
   - Kalau tab sudah muncul, klik Auto GSheet ON

4. Setelah Auto ON:
   - Barang Masuk otomatis update GSheet
   - Keluar Pabrik otomatis update GSheet
   - Produksi otomatis update stok + bahan yang dipakai di GSheet
   - Barang Dipakai Hari Ini otomatis update GSheet

5. Tab yang dicek staff/admin:
   - STOK_REALTIME: stok terbaru
   - KELUAR_MASUK_REALTIME: semua transaksi keluar/masuk hari itu
   - BARANG_DIPAKAI_REALTIME: bahan/dus/plastik/barang yang kepakai
   - PEMAKAIAN_PRODUK: bikin produk apa dan bahan apa saja yang terpotong
