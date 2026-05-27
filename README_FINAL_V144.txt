V144 FIX WEB SIMPAN PRODUKSI

Fix utama:
- Cache web dibust ke ?v=144 supaya browser tidak pakai app.js lama.
- Tombol Simpan Produksi Hari Ini diberi handler klik langsung + submit fallback.
- Jika sesi web habis, muncul pesan login ulang, bukan tombol diam.
- Service worker dibuat no-cache agar web Vercel selalu ambil file terbaru.

Cara buka setelah deploy:
https://harrys-farm-stock.vercel.app/
Kalau web masih lama, hapus data situs/cache browser lalu login ulang.
