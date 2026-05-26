Harry's Farm V86 - Arsip Hapus Fix Simple

Perbaikan:
1. Menu Arsip tidak pakai tabel melebar lagi.
2. Barang arsip tampil sebagai card/kartu, jadi tombol Pulihkan dan Hapus Permanen selalu terlihat.
3. Tombol Hapus Permanen tetap konfirmasi 2x.
4. Kalau delete REST gagal karena permission/RLS, aplikasi coba fallback RPC delete_item_cascade.
5. SQL V86 disediakan untuk mengaktifkan permission dan fungsi hapus permanen di Supabase.

Deploy:
cd "%USERPROFILE%\Downloads\harrys_farm_stock_app_v86_arsip_hapus_fix_simple"
vercel --prod

Buka:
https://harrys-farm-stock.vercel.app/?v=86

Kalau Hapus Permanen masih gagal:
Jalankan file ini di Supabase SQL Editor:
supabase-v86-delete-arsip-rpc.sql
