-- Harry's Farm V97 - Batas minimum untuk file V91
-- Jalankan di Supabase SQL Editor kalau nilai Minimum masih 0/kosong.

ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS min_stock numeric DEFAULT 0;

UPDATE public.items
SET min_stock = CASE
  WHEN lower(coalesce(category,'')) LIKE '%produk%' OR lower(coalesce(category,'')) LIKE '%akhir%' THEN 20
  WHEN lower(coalesce(category,'')) LIKE '%baku%' THEN 10
  WHEN lower(coalesce(category,'')) LIKE '%kemasan%' OR lower(coalesce(category,'')) LIKE '%plastik%' OR lower(coalesce(category,'')) LIKE '%dus%' THEN 100
  WHEN lower(coalesce(category,'')) LIKE '%penolong%' OR lower(coalesce(category,'')) LIKE '%qc%' OR lower(coalesce(category,'')) LIKE '%produksi%' THEN 10
  ELSE 5
END
WHERE coalesce(min_stock,0) = 0;

-- Cek hasil
SELECT category, count(*) AS total_item, min(min_stock) AS minimum_terkecil, max(min_stock) AS minimum_terbesar
FROM public.items
GROUP BY category
ORDER BY category;
