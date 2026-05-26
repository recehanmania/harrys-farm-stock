-- Harry's Farm V89 - QC / Produksi jadi Bahan Penolong
-- Jalankan di Supabase SQL Editor jika item seperti Masker/Nurse Cap/Sarung Tangan masih tampil sebagai QC / Produksi.
-- Aman: hanya mengubah kategori item APD/perlengkapan produksi menjadi Bahan Penolong.

alter table public.items
add column if not exists lokasi text null,
add column if not exists supplier text null,
add column if not exists qc_status text not null default 'OK',
add column if not exists archived boolean not null default false;

-- Rapikan item APD/perlengkapan produksi.
update public.items
set
  category = 'Bahan Penolong',
  lokasi = coalesce(nullif(lokasi,''), 'Perlengkapan Produksi'),
  supplier = coalesce(nullif(supplier,''), 'Supplier Bahan Penolong'),
  qc_status = coalesce(nullif(qc_status,''), 'OK'),
  archived = false
where lower(trim(name)) in (
  'masker',
  'nurse cap',
  'sarung tangan plastik',
  'sarung tangan latex',
  'sarung tangan karet',
  'sarung tangan',
  'spidol',
  'sabun cuci piring',
  'sabun lantai'
)
   or lower(coalesce(lokasi,'')) like '%perlengkapan produksi%'
   or lower(coalesce(category,'')) in ('qc / produksi','qc produksi','produksi / qc','perlengkapan produksi');

-- Kalau ada variasi tulisan QC Produksi di item APD, tetap jadikan Bahan Penolong.
update public.items
set category = 'Bahan Penolong',
    supplier = coalesce(nullif(supplier,''), 'Supplier Bahan Penolong'),
    qc_status = coalesce(nullif(qc_status,''), 'OK'),
    archived = false
where lower(coalesce(name,'')) ~ '(masker|nurse cap|sarung tangan|latex|spidol|sabun|apd|hairnet|hair net)';

-- Cek hasil
select category, name, unit, stock, min_stock, lokasi, supplier, qc_status, archived
from public.items
where category = 'Bahan Penolong'
order by name;
