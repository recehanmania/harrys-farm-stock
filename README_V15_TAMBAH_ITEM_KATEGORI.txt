HARRY'S FARM STOCK OPNAME V15 - ITEM & KATEGORI DARI KSTOK MARET 2026

File ini menambahkan item dan kategori dari:
KStok HF Maret Pabrik 2026.xlsx

Total item yang dibaca: 128

Ringkasan kategori:
- Produk Akhir: 37
- Bahan Baku: 10
- Bahan Kemas: 49
- Bahan Penolong: 7
- Bahan Tambahan Pangan: 25

CARA TAMBAH KE DATABASE:
1. Buka Supabase.
2. Masuk SQL Editor.
3. Buka file:
   supabase-v15-tambah-item-kategori-kstok-maret-2026.sql
4. Copy semua isinya.
5. Paste ke SQL Editor.
6. Klik Run.
7. Buka aplikasi, klik Refresh / Ctrl+F5.

CATATAN:
- SQL ini menambahkan item berdasarkan kombinasi Nama Barang + Kategori.
- Kalau item sudah ada dengan nama dan kategori yang sama, tidak diduplikasi.
- Kalau nama sama tapi kategori beda, tetap ditambahkan terpisah.
- Stok awal memakai kolom Stok Awal. Kalau kosong, memakai Stok Sekarang hanya jika nilainya positif.
- Pcs/Dus otomatis untuk Produk Akhir:
  500gr = 20
  1kg = 10
  2kg = 5

Kalau aplikasi sudah V14, tidak wajib upload ulang app. Cukup jalankan SQL V15.
Kalau mau upload ulang, pakai folder ini ke Netlify.


UPDATE V16 BARANG KELUAR PABRIK PER DUS:
- Menambah tab/menu Keluar Pabrik.
- Input tanggal, No Surat Jalan/DO, tujuan/customer, barang, keluar dus, keluar item/pcs, petugas, keterangan.
- Otomatis mengurangi stok.
- Ada tabel khusus Barang Keluar Pabrik.
- Ada export CSV khusus Barang Keluar Pabrik.
- Jalankan supabase-v16-keluar-pabrik-per-dus.sql di Supabase SQL Editor.


UPDATE V17 JWT EXPIRED FIX:
- Memperbaiki error "Gagal simpan: JWT expired".
- Saat token login expired, aplikasi mencoba refresh token otomatis lalu mengulang request simpan/update.
- Kalau refresh token juga habis, aplikasi akan minta login ulang.
- Setelah upload V17, logout lalu login ulang sekali agar sesi baru bersih.


UPDATE V18 ARSIP BARANG:
- Tambah fitur Arsip Barang.
- Barang yang diarsipkan tidak masuk kategori, dashboard, stock opname utama, input harian, dan keluar pabrik.
- Barang arsip masih bisa dilihat di menu Arsip.
- Barang arsip bisa dipulihkan.
- Jalankan file supabase-v18-arsip-barang.sql di Supabase SQL Editor.


UPDATE V19 ARSIP HIDDEN:
- Menu/tombol Arsip disembunyikan dari aplikasi utama.
- Barang yang klik Arsipkan akan hilang dari Stock Opname utama.
- Barang arsip tidak masuk kategori, dashboard, input harian, dan keluar pabrik.
- Kalau perlu pulihkan barang, lakukan dari Supabase:
  update public.items set archived = false where name = 'NAMA BARANG';
- Jalankan supabase-v19-arsip-hidden.sql kalau kolom archived belum ada.


UPDATE V20 ARSIP TIDAK HIDDEN:
- Menu Arsip dimunculkan lagi.
- Barang yang diarsipkan tidak masuk kategori/dashboard/input utama.
- Barang arsip tetap terlihat di menu Arsip.
- Barang arsip bisa dipulihkan dari menu Arsip.
- Jalankan supabase-v20-arsip-tidak-hidden.sql kalau kolom archived belum ada.


UPDATE V21 LINK VERCEL:
- Link aplikasi diarahkan ke: https://harrys-farm-stock.vercel.app/
- Kalau bikin APK di PWABuilder, masukkan link ini:
  https://harrys-farm-stock.vercel.app/
- APK lama harus dibuat ulang/rebuild supaya mengarah ke link baru.


UPDATE V22 ARSIP FIX:
- Barang archived=true difilter lebih keras dari Dashboard, Kategori, Input Harian, Stock Opname utama, dan Keluar Pabrik.
- Menu Arsip tetap ada untuk melihat dan memulihkan barang arsip.
- Tambah vercel.json no-cache agar update tidak nyangkut di cache.
- Jalankan supabase-v22-arsip-fix.sql di Supabase SQL Editor.


UPDATE V23 LINK BENAR:
- Link production yang benar:
  https://harrys-farm-stock.vercel.app/
- Deploy harus ke project Vercel bernama harrys-farm-stock.
- Jangan kirim link vercel.com dashboard ke staff.
- Staff masuk lewat:
  https://harrys-farm-stock.vercel.app/


UPDATE V24 FIX TAMPILAN:
- Dashboard dirapihkan supaya turun ke bawah.
- Kartu statistik tidak melebar/ketutup ke samping.
- Grafik dibuat responsive.
- Tab menu lebih rapi di HP dan laptop.
- Tabel tetap bisa digeser horizontal kalau kolom banyak.
- Cache PWA dinaikkan ke V24.


UPDATE V25 TOMBOL ARSIP:
- Tombol Arsipkan dipindah ke kolom Aksi di sebelah nama barang.
- Tidak perlu scroll jauh ke kanan untuk mengarsipkan barang.
- Barang yang diarsipkan pindah ke menu Arsip dan tidak masuk kategori utama.
- Cache PWA dinaikkan ke V25.


UPDATE V26 FIX TABEL:
- Barang Bahan Kemas/Stiker tidak lagi tampil Pcs/Dus 20.
- Pcs/Dus hanya untuk Produk Akhir/Produk Jadi atau item yang namanya jelas 500gr, 1kg, 2kg.
- Tombol Arsipkan ditaruh di bawah nama barang supaya selalu kelihatan.
- Tabel Stock Opname dibuat lebih pendek/lebar tidak berlebihan.
- Jalankan supabase-v26-fix-pcs-dus-arsip.sql di Supabase SQL Editor.


UPDATE V27 FIX CALL STACK:
- Memperbaiki error "Maximum call stack size exceeded".
- Penyebabnya fungsi pcsDusCell memanggil dirinya sendiri berulang-ulang.
- Tidak perlu SQL baru jika sudah menjalankan SQL V26.
- Upload ulang folder V27 ke Vercel dan alias-kan production terbaru ke harrys-farm-stock.vercel.app.


UPDATE V28 TABEL STOCK RAPI:
- Kolom Stock Opname diringkas menjadi Barang, Detail, Stok, Opname, Status.
- Tampilan tidak kepotong ke kanan.
- Fisik, Min, dan Selisih digabung di kolom Opname.
- Kategori, Kemasan, Satuan, dan Pcs/Dus digabung di kolom Detail.
- Tidak perlu SQL baru kalau sudah menjalankan SQL V26.


UPDATE V29 PROFESSIONAL VIP SIMPLE:
- Tampilan dibuat lebih premium/profesional.
- Aplikasi langsung buka menu Input agar staff tinggal input.
- Input Harian dibuat simple: barang keluar, barang masuk, simpan DONE.
- Setelah simpan tidak pindah jauh; muncul notifikasi DONE.
- Tetap memakai fitur arsip, dashboard, laporan, keluar pabrik, dan Supabase.
- Tidak perlu SQL baru kalau SQL V26 sudah dijalankan.


UPDATE V30 FIX LAPORAN PROFESSIONAL:
- Laporan tidak lagi memakai tabel lebar.
- Laporan tampil sebagai kartu/list profesional, tanpa geser kiri-kanan.
- Detail transaksi tetap lengkap: tanggal, jenis, barang, keluar, masuk, petugas, keterangan, SJ/DO, tujuan.
- Export laporan tetap ada.
- Tidak perlu SQL baru.


UPDATE V31 ANTICACHE NO-SCROLL:
- Service worker lama dimatikan supaya tampilan lama tidak nyangkut.
- Cache browser/PWA dibersihkan otomatis saat pertama buka V31.
- Ada tulisan "V31 NO-SCROLL AKTIF" sebagai tanda versi baru benar-benar kebuka.
- Laporan dipaksa tampil kartu/list, bukan tabel lebar.
- Deploy ulang lalu alias-kan Production terbaru ke harrys-farm-stock.vercel.app.


UPDATE V32 POS KASIR SIMPLE:
- Input dibuat seperti aplikasi POS kasir.
- Alur: pilih kategori > pilih barang > pilih barang keluar/masuk > isi jumlah > isi catatan/keterangan > DONE.
- Ada mode Barang Keluar dan Barang Masuk yang jelas.
- Ada Catatan / Deskripsi / Keterangan agar laporan mudah dipahami.
- Ada validasi jika barang keluar lebih besar dari stok.
- Tetap memakai Supabase, Login Staff, Arsip, Laporan, dan Keluar Pabrik.
- Tidak perlu SQL baru kalau SQL V26 sudah jalan.


UPDATE V33 POS FINAL CEK ULANG:
- Fix bug utama V32: ada 3 function inputPage, sehingga tampilan bisa balik ke input lama.
- Sekarang tinggal 1 inputPage, yaitu POS STOCK MODE.
- App seperti POS kasir: kategori > barang > keluar/masuk > jumlah > catatan > DONE.
- Laporan tetap kartu/list tanpa geser kiri-kanan.
- Cache-bust app.js/styles.css/config.js pakai ?v=33.
- No service worker cache agar versi lama tidak nyangkut.
- Tidak perlu SQL baru kalau SQL V26 sudah dijalankan.


UPDATE V34 EDIT STOK LANGSUNG:
- Menu Stok sekarang bisa edit stok sistem langsung.
- Ubah angka di kolom Edit Stok, lalu klik/tekan area luar kolom.
- Sistem otomatis menyesuaikan starting_stock agar stok akhir sesuai angka yang diisi.
- Muncul notifikasi DONE setelah stok berhasil diubah.
- Tidak perlu SQL baru.


UPDATE V35 TAMBAH BARANG SPESIFIK:
- Form Tambah Barang dibuat lebih jelas dan spesifik.
- Field: Jenis/Kategori, Nama Barang, Varian/Brand, Ukuran/Kemasan, Stok Awal, Satuan, Batas Minimum, Pcs/Dus, Catatan/Deskripsi.
- Nama final otomatis digabung dari Nama + Varian + Ukuran.
- Pcs/Dus otomatis dari ukuran: 500gr=20, 1kg=10, 2kg=5.
- Kalau Supabase schema belum kebaca kolom opsional, aplikasi retry pakai kolom dasar.
- Jalankan supabase-v35-tambah-barang-schema-check.sql kalau masih error.


UPDATE V36 ITEM SESUAI ABJAD:
- Daftar barang di Input POS diurutkan A-Z.
- Daftar barang di Stok diurutkan A-Z.
- Daftar barang di Keluar Pabrik diurutkan A-Z.
- Daftar barang di Arsip diurutkan A-Z.
- Kategori di filter juga diurutkan A-Z.
- Tidak perlu SQL baru.


UPDATE V37 TAMBAH BARANG DRAFT FIX:
- Memperbaiki masalah saat ketik Nama Barang lalu isian hilang.
- Form Tambah Barang sekarang menyimpan draft sementara di state, jadi tidak hilang saat render/sync/error.
- Form hanya reset kalau barang berhasil ditambahkan.
- Kalau tambah barang gagal, isian tetap ada supaya bisa diperbaiki.
- Jalankan supabase-v37-tambah-barang-schema-check.sql kalau masih ada error schema Supabase.


UPDATE V38 NO AUTO REFRESH:
- Memperbaiki masalah halaman seperti refresh sendiri per detik.
- Script anti-cache lama yang memakai location.replace dihapus.
- Service worker/cache lama tetap dibersihkan, tapi tanpa reload halaman.
- Form Tambah Barang tetap memakai draft fix, jadi ketikan tidak hilang.
- Tidak perlu SQL baru.


UPDATE V39 SCHEMA FIX KELUAR DUS:
- Memperbaiki error: Could not find the 'keluar_dus' column of 'stock_transactions' in the schema cache.
- Aplikasi sekarang bisa retry simpan transaksi mode basic kalau Supabase belum punya kolom opsional.
- Untuk fitur dus, surat jalan, tujuan, dan keluar pabrik full, WAJIB jalankan:
  supabase-v39-fix-schema-keluar-dus.sql
- Tidak ada auto refresh loop.


UPDATE V40 JENIS DUS:
- Menambah pilihan Jenis Dus di menu Keluar Pabrik.
- Pilihan: Polos dan Sablon.
- Jenis Dus ikut tampil di tabel Keluar Pabrik.
- Jenis Dus ikut masuk Laporan dan Export CSV.
- Jalankan supabase-v40-jenis-dus-polos-sablon.sql di Supabase agar kolom jenis_dus aktif.
- Kalau kolom jenis_dus belum aktif, aplikasi tetap simpan mode basic dan jenis dus masuk catatan.


UPDATE V41 AUTO POTONG STOK DUS:
- Saat Keluar Pabrik, stok produk otomatis berkurang sesuai Pcs/Dus.
- Stok Kardus Polos otomatis berkurang kalau Jenis Dus = Polos.
- Stok Kardus Sablon otomatis berkurang kalau Jenis Dus = Sablon.
- Jumlah kardus yang dipotong = angka Keluar Dus.
- Wajib jalankan supabase-v41-auto-potong-stok-dus.sql agar master Kardus Polos/Sablon ada.


UPDATE V42 AUTO POTONG STOK PLASTIK:
- Saat Keluar Pabrik, stok produk otomatis berkurang.
- Stok Kardus Polos/Sablon otomatis berkurang sesuai Keluar Dus.
- Stok Plastik otomatis berkurang sesuai total pcs produk keluar.
- Ada pilihan Jenis Plastik: Auto, Southmount, HF, Polos, Plastik HF Baru.
- Auto memilih plastik dari nama produk dan ukuran 500gr/1kg/2kg.
- Wajib jalankan supabase-v42-auto-potong-stok-plastik.sql.


UPDATE V43 DETAIL AUTO POTONG PABRIK:
- Menu Keluar Pabrik sekarang menampilkan Rincian Auto Potong sebelum simpan.
- Rincian berisi: Produk Jadi, Dus, dan Plastik.
- Setelah simpan, note transaksi otomatis berisi detail stok yang dipotong.
- Stok opname tetap otomatis terpotong dari transaksi produk, kardus, dan plastik.
- Tidak perlu SQL baru jika V42 sudah dijalankan.


UPDATE V44 PENDATAAN PRO:
- Menambah Validasi Pendataan di Dashboard.
- Cek apakah Kardus Polos, Kardus Sablon, item Plastik, dan Pcs/Dus produk sudah lengkap.
- Laporan sekarang punya filter Tanggal dan Jenis Transaksi.
- Keluar Pabrik memberi peringatan kalau Tujuan/Customer kosong.
- Mempermudah pendataan harian, produksi, keluar pabrik, dus, dan plastik.
- Tidak perlu SQL baru jika V42/V43 sudah berjalan.


UPDATE V45 PRODUKSI + AUDIT + PRINT:
- Menambah menu Produksi.
- Produksi bisa menambah stok produk jadi.
- Bahan yang dipakai produksi otomatis mengurangi stok bahan.
- Edit stok manual sekarang masuk audit log di Laporan.
- Laporan punya tombol Print Laporan.
- Tidak perlu tabel baru, tetap memakai stock_transactions.
- Jalankan supabase-v45-produksi-audit-check.sql kalau schema belum lengkap.


UPDATE V46 FILTER BAHAN PRODUKSI:
- Di menu Produksi, dropdown Bahan yang Dipakai sekarang bisa difilter kategori.
- Default filter: Bahan Tambahan Pangan agar daftar bahan tidak terlalu banyak.
- Bisa ganti ke Bahan Baku, Bahan Kemas, Plastik & Kemasan, atau Semua Bahan.
- Tidak perlu SQL baru.


UPDATE V47 ABSEN KARYAWAN:
- Menambah menu Absen.
- Bisa input Nama Karyawan, Status, Jam Masuk, Jam Pulang, Keterangan, Petugas.
- Ada filter tanggal dan pencarian absen.
- Ada Export Absen CSV.
- Wajib jalankan supabase-v47-absen-karyawan.sql di Supabase.


UPDATE V48 ABSEN SHIFT KARYAWAN:
- Absen sekarang punya Shift 1: 07:00 - 16:00.
- Shift 2: 15:00 - 00:00 / 12 malam.
- Ada pilihan Lembur dan Jam Lembur.
- Ada Master Karyawan: default 9 orang dari SQL.
- Nama karyawan bisa ditambah, diedit, dan dinonaktifkan.
- Wajib jalankan supabase-v48-absen-shift-karyawan.sql di Supabase.


UPDATE V49 ABSEN SHIFT FLEKSIBEL:
- Shift di Master Karyawan dihilangkan dari tampilan.
- Master Karyawan sekarang hanya Nama + Keterangan.
- Shift dipilih saat input absen harian karena bisa berubah-ubah.
- Shift 1 tetap auto jam 07:00 - 16:00.
- Shift 2 tetap auto jam 15:00 - 00:00 / 12 malam.
- Tidak perlu SQL baru kalau V48 sudah dijalankan.


UPDATE V50 SIMPLE FINAL CHECKLIST:
- Dashboard dibuat lebih simple seperti Home Operasional.
- Ada Menu Cepat: Absen, Produksi, Keluar Pabrik, Input, Stok, Laporan.
- Ada Checklist Harian supaya pendataan tidak ada yang kelewat.
- Ada Rekomendasi Fix otomatis untuk stok minus, stok kurang, master data belum lengkap, dan absen.
- Default aplikasi sekarang buka Home/Dashboard dulu.
- Tidak perlu SQL baru kalau V49 sudah berjalan.


UPDATE V51 ABSEN SIMPLE:
- Absen dibuat lebih mudah.
- Staff tinggal pilih tanggal, shift, status, dan centang karyawan.
- Bisa simpan absen banyak karyawan sekaligus.
- Master karyawan disederhanakan dan dipindah ke bagian bawah.
- Edit daftar karyawan disembunyikan dalam dropdown Lihat/Edit agar tampilan tidak penuh.
- Tidak perlu SQL baru kalau V48/V50 sudah dijalankan.


UPDATE V52 ALL FIX OPERASIONAL:
- Blok stok minus: transaksi keluar tidak bisa disimpan jika stok tidak cukup.
- Closing harian: admin bisa kunci data hari ini.
- Rekap absen bulanan: total masuk, izin, sakit, alpha, lembur, jam lembur.
- Nomor transaksi otomatis: OUT/IN/SJ/PROD/ABSEN.
- Print laporan harian lengkap: absen, produksi, keluar pabrik, stok kritis, tanda tangan.
- Role Admin/Staff: Staff dibatasi untuk aksi sensitif seperti hapus/edit stok/master.
- Rekap produksi hari ini muncul di menu Produksi.
- Wajib jalankan supabase-v52-all-fix-operasional.sql agar semua kolom/tabel aktif.


UPDATE V53 FINAL AUDIT:
- Fix filter Kurang/Habis agar stok HABIS ikut tampil saat klik kartu dashboard.
- Menambah panel Final Audit Sistem di Home.
- Menambah tombol Backup JSON.
- Menambah SQL final audit: supabase-v53-final-audit.sql.
- Menambah README_FINAL_V53.txt.
- Ini versi final yang disarankan dipakai.


UPDATE V54 UI ELEGAN FINAL:
- Penyempurnaan tampilan supaya lebih minimalis, elegan, dan mudah dipakai.
- Navigasi sticky, card lebih clean, form lebih nyaman, tabel lebih rapi.
- Absen simple dibuat lebih mudah dilihat.
- Tidak perlu SQL baru jika V53 sudah berjalan.


UPDATE V55 FINAL SAFETY:
- Cegah absen dobel.
- Tambah Edit Absen.
- Tambah PIN Admin UI, default 1234.
- Tambah Backup Bulanan JSON.
- Warning SOP sebelum Closing.
- Ini final big update yang disarankan dipakai.
