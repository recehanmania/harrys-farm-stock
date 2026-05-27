HARRYS FARM STOCK OPNAME V143 - LINK TEPAT VERCEL

Link aplikasi utama:
https://harrys-farm-stock.vercel.app/

Perubahan:
- manifest.json start_url/scope/id diarahkan tepat ke https://harrys-farm-stock.vercel.app/
- SITE_URL.txt diarahkan tepat ke link utama tanpa query cache.
- Fitur dan tampilan mengikuti V142/V141.

Cara push dari Termux:
cd ~/harrys-farm-stock
rm -rf ~/v143
mkdir -p ~/v143
unzip -o /sdcard/Download/Harrys_Farm_Stock_Opname_V143_Link_Tepat_Vercel.zip -d ~/v143
cp -r ~/v143/Harrys_Farm_Stock_Opname_V143_Link_Tepat_Vercel/. ~/harrys-farm-stock/
git add .
git commit -m "Update V143 link tepat Vercel"
git push
