HARRY'S FARM STOCK OPNAME - V55 FINAL SAFETY

FINAL BIG UPDATE:
- UI elegan dari V54 tetap dipakai.
- Cegah absen dobel per tanggal/karyawan.
- Tambah tombol Edit Absen.
- Mode Admin pakai PIN.
- PIN default pertama: 1234.
- PIN bisa diganti dari tombol Ganti PIN.
- Closing harian punya warning checklist SOP.
- Tambah Backup Bulanan JSON.
- Blok stok minus tetap aktif.
- Print laporan harian lengkap tetap aktif.

SQL:
- Kalau V54/V53 sudah jalan, SQL baru tidak wajib.
- Kalau mau aman, jalankan supabase-v55-final-safety-check.sql.

DEPLOY:
vercel --prod

CEK:
https://harrys-farm-stock.vercel.app/?v=55

TANDA BENAR:
V55 FINAL SAFETY AKTIF

JANGAN DEPLOY:
- kode canvas/localStorage.
- file React lama.
