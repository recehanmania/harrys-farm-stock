-- Harry's Farm V62 - Audit Pcs/Dus Fix Check
-- Tidak ada tabel baru.
-- Query ini hanya untuk cek Produk Akhir / Produk Jadi yang pcs_per_dus masih 0.

select id, name, category, pcs_per_dus
from public.items
where coalesce(archived, false) = false
  and (
    lower(trim(coalesce(category,''))) like '%produk akhir%'
    or lower(trim(coalesce(category,''))) like '%produk jadi%'
  )
  and coalesce(pcs_per_dus, 0) = 0
order by name;

notify pgrst, 'reload schema';
