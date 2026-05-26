V126 Link Utama Harrys Farm Stock

Link utama aplikasi:
https://harrys-farm-stock.vercel.app/

Perubahan:
- SITE_URL.txt diarahkan ke https://harrys-farm-stock.vercel.app/
- manifest.json start_url/scope/id diarahkan ke https://harrys-farm-stock.vercel.app/
- versi cache dinaikkan ke v=126 agar browser/staff mengambil file terbaru
- Fitur V125 gambar per item tetap ada

Setelah deploy, kalau Vercel masih menampilkan link production acak, jalankan:
vercel alias set <LINK_PRODUCTION_TERBARU> harrys-farm-stock.vercel.app
