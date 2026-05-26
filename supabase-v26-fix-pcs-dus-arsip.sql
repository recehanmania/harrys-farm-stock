-- Harry's Farm V26 - Fix Pcs/Dus & Arsip
-- Jalankan di Supabase SQL Editor.
-- Tujuan: Bahan Kemas/Stiker tidak ikut hitungan dus, kecuali item yang jelas produk 500gr/1kg/2kg.

alter table public.items
add column if not exists archived boolean not null default false,
add column if not exists pcs_per_dus numeric not null default 0;

-- Reset Pcs/Dus untuk barang yang bukan Produk Akhir/Produk Jadi dan tidak mengandung ukuran 500gr/1kg/2kg.
update public.items
set pcs_per_dus = 0
where not (
  lower(coalesce(category,'')) like '%produk akhir%'
  or lower(coalesce(category,'')) like '%produk jadi%'
  or lower(coalesce(name,'')) ~ '(500\s*(gr|g)|0\.5\s*kg|1\s*kg|1kg|2\s*kg|2kg)'
);

-- Isi otomatis untuk produk yang jelas ukurannya.
update public.items
set pcs_per_dus = case
  when lower(name) ~ '500\s*(gr|g)' or lower(name) like '%0.5 kg%' then 20
  when lower(name) like '%2 kg%' or lower(name) like '%2kg%' then 5
  when lower(name) like '%1 kg%' or lower(name) like '%1kg%' then 10
  else pcs_per_dus
end
where (
  lower(coalesce(category,'')) like '%produk akhir%'
  or lower(coalesce(category,'')) like '%produk jadi%'
  or lower(coalesce(name,'')) ~ '(500\s*(gr|g)|0\.5\s*kg|1\s*kg|1kg|2\s*kg|2kg)'
);

notify pgrst, 'reload schema';

-- Cek barang yang masih punya Pcs/Dus:
select id, name, category, pcs_per_dus
from public.items
where pcs_per_dus > 0
order by category, name;
