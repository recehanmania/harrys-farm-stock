V127 Fix Simpan Gambar
- Memperbaiki upload/link gambar item yang sebelumnya tidak tersimpan dari detail stok
- Tambah autosave untuk URL gambar, upload file, dan hapus gambar
- Tambah fallback localStorage jika kolom image_url belum aktif di Supabase
- Sertakan SQL supabase-v127-fix-simpan-gambar.sql agar gambar tersimpan permanen dan terlihat di semua staff
- Cache dinaikkan ke v127
