CARA EXPORT HARIAN KE GOOGLE SHEET - HARRY'S FARM V87

A. SETUP GOOGLE SHEET
1. Buka Google Sheets dan buat spreadsheet baru.
2. Klik Extensions / Ekstensi > Apps Script.
3. Hapus kode lama.
4. Buka file GOOGLE_APPS_SCRIPT_EXPORT_HARIAN.gs dari folder ini.
5. Copy semua isinya ke Apps Script.
6. Klik Save.
7. Klik Deploy > New deployment.
8. Pilih type: Web app.
9. Execute as: Me / Saya.
10. Who has access: Anyone / Siapa saja.
11. Klik Deploy, lalu Allow / Izinkan akun Google.
12. Copy Web app URL yang berakhiran /exec.

B. SETUP DI APLIKASI
1. Deploy aplikasi V87 ke Vercel.
2. Buka aplikasi Harry's Farm.
3. Masuk menu Laporan.
4. Klik tombol Set GSheet.
5. Tempel Web app URL dari Apps Script.
6. Pilih tanggal laporan.
7. Klik Kirim GSheet Harian.

C. HASIL DI GOOGLE SHEET
Setiap export membuat / menimpa tab harian:
Harian_YYYY-MM-DD

Isi tab:
- Ringkasan harian
- Transaksi harian
- Stok kritis / kurang / habis
- Snapshot semua stok
- Log export tersimpan di tab Log Export

Catatan:
- Ini export tombol manual harian. Kalau mau full otomatis jam tertentu walau aplikasi tidak dibuka, perlu dibuat versi tambahan memakai cron / Apps Script trigger.
- Kalau Google minta izin, klik Advanced > Go to project > Allow.
