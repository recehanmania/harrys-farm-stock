-- Harry's Farm V15 - Tambah item & kategori dari file:
-- KStok HF Maret Pabrik 2026.xlsx
-- Total item: 128
--
-- Cara pakai:
-- 1) Supabase > SQL Editor > New Query
-- 2) Paste semua isi file ini
-- 3) Klik Run
-- 4) Buka aplikasi lalu Refresh / Ctrl+F5
--
-- Catatan:
-- - Item baru ditambahkan berdasarkan kombinasi Nama Barang + Kategori.
-- - Kalau nama sama tapi kategori beda, tetap ditambahkan sebagai item terpisah.
-- - Stok awal diambil dari kolom Stok Awal; kalau kosong dipakai Stok Sekarang jika nilainya positif.
-- - Pcs/Dus hanya otomatis untuk Produk Akhir: 500gr=20, 1kg=10, 2kg=5.

alter table public.items
add column if not exists pcs_per_dus numeric not null default 0,
add column if not exists item_code text null;

with source_items(category, name, unit, starting_stock, min_stock, pcs_per_dus, item_code) as (
  values
('Produk Akhir', 'Wedges Plain 500gr', 'pcs', 0, 0, 20, 'PA01'),
('Produk Akhir', 'Wedges Plain 1kg', 'pcs', 0, 0, 10, 'PA02'),
('Produk Akhir', 'Wedges Plain 2kg', 'pcs', 0, 0, 5, 'PA03'),
('Produk Akhir', 'Waffle Seasoned Fries 500gr', 'pcs', 0, 0, 20, 'PA04'),
('Produk Akhir', 'Waffle Seasoned Fries 1kg', 'pcs', 0, 0, 10, 'PA05'),
('Produk Akhir', 'Waffle Seasoned Fries 2kg', 'pcs', 0, 0, 5, 'PA06'),
('Produk Akhir', 'Rendang Seasoned Wedges 500gr', 'pcs', 11, 0, 20, 'PA07'),
('Produk Akhir', 'Rendang Seasoned Wedges 1kg', 'pcs', 0, 0, 10, 'PA08'),
('Produk Akhir', 'Rendang Seasoned Wedges 2kg', 'pcs', 0, 0, 5, 'PA09'),
('Produk Akhir', 'Mashed Potato 500gr', 'pcs', 37, 0, 20, 'PA10'),
('Produk Akhir', 'Mashed Potato 1kg', 'pcs', 9, 0, 10, 'PA11'),
('Produk Akhir', 'Mashed Potato 2kg', 'pcs', 0, 0, 5, 'PA12'),
('Produk Akhir', 'Cheesy Potato Nuggets 500gr', 'pcs', 0, 0, 20, 'PA13'),
('Produk Akhir', 'Cheesy Potato Nuggets 1kg', 'pcs', 11, 0, 10, 'PA14'),
('Produk Akhir', 'Cheesy Potato Nuggets 2kg', 'pcs', 0, 0, 5, 'PA15'),
('Produk Akhir', 'Mozzarella Potato Sticks 10pcs', 'pcs', 0, 0, 0, 'PA16'),
('Produk Akhir', 'Mozzarella Potato Balls 10pcs', 'pcs', 0, 0, 0, 'PA17'),
('Produk Akhir', 'Mixed Vegetables 4 Ways 1kg', 'pcs', 4, 0, 10, 'PA18'),
('Produk Akhir', 'Mixed Vegetables 3 Ways 1kg', 'pcs', 5, 0, 10, 'PA19'),
('Produk Akhir', 'Mixed Capcay 1kg', 'pcs', 0, 0, 10, 'PA20'),
('Produk Akhir', 'Jagung Manis Pipil 1kg', 'pcs', 12, 0, 10, 'PA21'),
('Produk Akhir', 'Jagung', 'kg', 0, 0, 0, 'PA22'),
('Produk Akhir', 'Wortel', 'kg', 0, 0, 0, 'PA23'),
('Produk Akhir', 'Buncis', 'kg', 0, 0, 0, 'PA24'),
('Produk Akhir', 'Kacang Polong', 'kg', 0, 0, 0, 'PA25'),
('Produk Akhir', 'Crinkle Cut 500gr', 'pcs', 0, 0, 20, 'PA26'),
('Produk Akhir', 'Crinkle Cut 1kg', 'pcs', 0, 0, 10, 'PA27'),
('Produk Akhir', 'Crinkle Cut 2kg', 'pcs', 0, 0, 5, 'PA28'),
('Produk Akhir', 'Seasoned Wedges 500gr', 'pcs', 0, 0, 20, 'PA29'),
('Produk Akhir', 'Seasoned Wedges 1kg ( Sablon )', 'pcs', 30, 0, 10, 'PA30'),
('Produk Akhir', 'Seasoned Wedges 2kg', 'pcs', 4, 0, 5, 'PA31'),
('Produk Akhir', 'Sweet Chopped Carrots', 'pcs', 0, 0, 0, 'PA32'),
('Produk Akhir', 'Shoestring Battercoated 2kg', 'kg', 0, 0, 5, 'PA33'),
('Produk Akhir', 'Baby Potato', 'pcs', 0, 0, 0, 'PA34'),
('Produk Akhir', 'Edamame 1kg', 'pcs', 0, 0, 10, 'PA35'),
('Produk Akhir', 'Seasoned Wedges 1kg ( Polos )', 'pcs', 36, 0, 10, ''),
('Produk Akhir', 'Mashed Potato 1kg ( Sablon ) GB', 'pcs', 0, 0, 10, ''),
('Bahan Baku', 'Kentang Atlantik', 'kg', 0, 0, 0, 'BB01'),
('Bahan Baku', 'Kentang Granola', 'kg', 0, 0, 0, 'BB02'),
('Bahan Baku', 'Kentang Medians', 'kg', 0, 0, 0, 'BB03'),
('Bahan Baku', 'Jagung', 'kg', 0, 0, 0, 'BB04'),
('Bahan Baku', 'Wortel', 'kg', 0, 0, 0, 'BB05'),
('Bahan Baku', 'Buncis', 'kg', 0, 0, 0, 'BB06'),
('Bahan Baku', 'Kacang Polong', 'kg', 0, 0, 0, 'BB07'),
('Bahan Baku', 'Brokoli', 'kg', 0, 0, 0, 'BB08'),
('Bahan Baku', 'Kembang Kol', 'kg', 0, 0, 0, 'BB09'),
('Bahan Baku', 'Kentang Ventury', 'kg', 0, 0, 0, 'BB10'),
('Bahan Kemas', 'Plastik uk 30x45', 'pcs', 41600, 0, 0, 'BK01'),
('Bahan Kemas', 'Plastik uk 20x35', 'pcs', 215, 0, 0, 'BK02'),
('Bahan Kemas', 'Plastik uk 15x25', 'pcs', 0, 0, 0, 'BK03'),
('Bahan Kemas', 'Plastik uk 90x120 (trashbag)', 'pcs', 32, 0, 0, 'BK04'),
('Bahan Kemas', 'Plastik Cheesy Potato Nugget 1kg', 'pcs', 45, 0, 0, 'BK05'),
('Bahan Kemas', 'Plastik Cheesy Potato Nugget 250gr', 'pcs', 95, 0, 0, 'BK06'),
('Bahan Kemas', 'Plastik Cheesy Potato Nugget 500gr (sablon)', 'pcs', 65, 0, 0, 'BK07'),
('Bahan Kemas', 'Plastik Hashbrown 1kg', 'pcs', 180, 0, 0, 'BK08'),
('Bahan Kemas', 'Plastik Hashbrown 250gr', 'pcs', 200, 0, 0, 'BK09'),
('Bahan Kemas', 'Plastik Hashbrown 500gr', 'pcs', 0, 0, 0, 'BK10'),
('Bahan Kemas', 'Plastik Jagung 500gr', 'pcs', 0, 0, 0, 'BK11'),
('Bahan Kemas', 'Plastik Jagung 1kg', 'pcs', 480, 0, 0, 'BK12'),
('Bahan Kemas', 'Plastik Mashed Potato 1kg', 'pcs', 0, 0, 0, 'BK13'),
('Bahan Kemas', 'Plastik Mashed Potato 250gr', 'pcs', 66, 0, 0, 'BK14'),
('Bahan Kemas', 'Plastik Mashed Potato 500gr (sablon)', 'pcs', 0, 0, 0, 'BK15'),
('Bahan Kemas', 'Plastik Mix Vegetables 1kg', 'pcs', 45, 0, 0, 'BK16'),
('Bahan Kemas', 'Plastik Mix Vegetables 500gr', 'pcs', 47, 0, 0, 'BK17'),
('Bahan Kemas', 'Plastik Polos 500gr', 'pcs', 22, 0, 0, 'BK18'),
('Bahan Kemas', 'Plastik Polos 1kg', 'pcs', 215, 0, 0, 'BK19'),
('Bahan Kemas', 'Plastik Polos 2kg', 'pcs', 4160, 0, 0, 'BK20'),
('Bahan Kemas', 'Plastik Rendang Wedges 500gr (sablon)', 'pcs', 0, 0, 0, 'BK21'),
('Bahan Kemas', 'Plastik Rendang Wedges 1kg', 'pcs', 0, 0, 0, 'BK22'),
('Bahan Kemas', 'Plastik Seasoned Fries 1kg', 'pcs', 0, 0, 0, 'BK23'),
('Bahan Kemas', 'Plastik Seasoned Fries 250gr', 'pcs', 0, 0, 0, 'BK24'),
('Bahan Kemas', 'Plastik Seasoned Fries 500gr', 'pcs', 0, 0, 0, 'BK25'),
('Bahan Kemas', 'Plastik Seasoned Wedges 1kg', 'pcs', 0, 0, 0, 'BK26'),
('Bahan Kemas', 'Plastik Seasoned Wedges 250gr', 'pcs', 0, 0, 0, 'BK27'),
('Bahan Kemas', 'Plastik Seasoned Wedges 500gr', 'pcs', 256, 0, 0, 'BK28'),
('Bahan Kemas', 'Plastik Shoestring 1kg', 'pcs', 71, 0, 0, 'BK29'),
('Bahan Kemas', 'Plastik Shoestring 500gr', 'pcs', 61, 0, 0, 'BK30'),
('Bahan Kemas', 'Plastik Straightcut 1kg', 'pcs', 0, 0, 0, 'BK31'),
('Bahan Kemas', 'Plastik Straightcut 500gr', 'pcs', 87, 0, 0, 'BK32'),
('Bahan Kemas', 'Plastik Tulisan Hitam 1kg', 'pcs', 0, 0, 0, 'BK33'),
('Bahan Kemas', 'Plastik Waffle Fries 500gr (sablon)', 'pcs', 396, 0, 0, 'BK34'),
('Bahan Kemas', 'Plastik Waffle Fries 1kg', 'pcs', 0, 0, 0, 'BK35'),
('Bahan Kemas', 'Plastik Wedges Plain 1kg', 'pcs', 120, 0, 0, 'BK36'),
('Bahan Kemas', 'Plastik Wedges Plain 250gr', 'pcs', 57, 0, 0, 'BK37'),
('Bahan Kemas', 'Plastik Wedges Plain 500gr', 'pcs', 234, 0, 0, 'BK38'),
('Bahan Kemas', 'Plastik Wedges Plain 2kg', 'pcs', 40, 0, 0, 'BK39'),
('Bahan Kemas', 'Stiker Potato Balls', 'pcs', 0, 0, 0, 'BK40'),
('Bahan Kemas', 'Stiker Potato Sticks', 'pcs', 0, 0, 0, 'BK41'),
('Bahan Kemas', 'Kardus Polos', 'pcs', 108, 0, 0, 'BK42'),
('Bahan Kemas', 'Kardus Sablon', 'pcs', 0, 0, 0, 'BK43'),
('Bahan Kemas', 'Lakban', 'Roll', 3, 0, 0, 'BK44'),
('Bahan Kemas', 'plastik 60 x 100', 'pcs', 0, 0, 0, 'BK45'),
('Bahan Kemas', 'Plastik Southmount 1kg', 'pcs', 560, 0, 0, 'BK46'),
('Bahan Kemas', 'Plastik Southmount 2kg', 'pcs', 411, 0, 0, 'BK47'),
('Bahan Kemas', 'plastik 40 x 60', 'pcs', 0, 0, 0, 'BK48'),
('Bahan Kemas', 'Plastik Crinkle Cut 1kg', 'pcs', 19, 0, 0, 'BK49'),
('Bahan Penolong', 'Masker', 'pcs', 75, 0, 0, 'BP01'),
('Bahan Penolong', 'Sarung Tangan Plastik', 'pcs', 137, 0, 0, 'BP02'),
('Bahan Penolong', 'Sarung Tangan Latex', 'pcs', 0, 0, 0, 'BP03'),
('Bahan Penolong', 'Nurse Cap', 'pcs', 17, 0, 0, 'BP04'),
('Bahan Penolong', 'Spidol', 'pcs', 12, 0, 0, 'BP05'),
('Bahan Penolong', 'Sabun Cuci Piring', 'ml', 570, 0, 0, 'BP06'),
('Bahan Penolong', 'Sabun Lantai', 'pcs', 0, 0, 0, 'BP07'),
('Bahan Tambahan Pangan', 'Minyak Sawit', 'liter', 0, 0, 0, 'BTP01'),
('Bahan Tambahan Pangan', 'Minyak Canola', 'liter', 5, 0, 0, 'BTP02'),
('Bahan Tambahan Pangan', 'Dextrose Monohydrate', 'gr', 5300, 0, 0, 'BTP03'),
('Bahan Tambahan Pangan', 'Malto Dextrin', 'gr', 25000, 0, 0, 'BTP04'),
('Bahan Tambahan Pangan', 'Citric Acid', 'gr', 25275, 0, 0, 'BTP05'),
('Bahan Tambahan Pangan', 'Garam', 'gr', 14790, 0, 0, 'BTP06'),
('Bahan Tambahan Pangan', 'Knorr', 'gr', 9730, 0, 0, 'BTP07'),
('Bahan Tambahan Pangan', 'Tepung Beras', 'gr', 65000, 0, 0, 'BTP08'),
('Bahan Tambahan Pangan', 'Tepung Terigu', 'gr', 0, 0, 0, 'BTP09'),
('Bahan Tambahan Pangan', 'Tepung Jagung', 'gr', 3540, 0, 0, 'BTP10'),
('Bahan Tambahan Pangan', 'Tepung Kentang', 'gr', 2610, 0, 0, 'BTP11'),
('Bahan Tambahan Pangan', 'Bawang Putih Bubuk / Garlic Powder', 'gr', 34555, 0, 0, 'BTP12'),
('Bahan Tambahan Pangan', 'Roasted Garlic', 'gr', 1000, 0, 0, 'BTP13'),
('Bahan Tambahan Pangan', 'Lada Putih', 'gr', 2805, 0, 0, 'BTP14'),
('Bahan Tambahan Pangan', 'Bumbu Rendang Indofood', 'pcs', 27, 0, 0, 'BTP15'),
('Bahan Tambahan Pangan', 'Keju Mozzarella', 'gr', 0, 0, 0, 'BTP16'),
('Bahan Tambahan Pangan', 'Keju Cheddar', 'gr', 6500, 0, 0, 'BTP17'),
('Bahan Tambahan Pangan', 'Polenta', 'gr', 0, 0, 0, 'BTP18'),
('Bahan Tambahan Pangan', 'Baking Powder', 'gr', 6380, 0, 0, 'BTP19'),
('Bahan Tambahan Pangan', 'Ragi', 'gr', 0, 0, 0, 'BTP20'),
('Bahan Tambahan Pangan', 'Chili Powder', 'gr', 0, 0, 0, 'BTP21'),
('Bahan Tambahan Pangan', 'Paprika Bubuk', 'gr', 15430, 0, 0, 'BTP22'),
('Bahan Tambahan Pangan', 'Pewarna Merah', 'ml', 0, 0, 0, 'BTP23'),
('Bahan Tambahan Pangan', 'Maizena', 'gr', 65700, 0, 0, 'BTP24'),
('Bahan Tambahan Pangan', 'Tapioka', 'gr', 1000, 0, 0, 'BTP25')
),
updated as (
  update public.items i
  set
    unit = s.unit,
    pcs_per_dus = case when coalesce(i.pcs_per_dus,0) = 0 then s.pcs_per_dus else i.pcs_per_dus end,
    item_code = coalesce(nullif(i.item_code,''), nullif(s.item_code,''))
  from source_items s
  where lower(trim(i.name)) = lower(trim(s.name))
    and lower(trim(i.category)) = lower(trim(s.category))
  returning i.id
)
insert into public.items (category, name, unit, starting_stock, min_stock, pcs_per_dus, item_code, physical_stock)
select
  s.category,
  s.name,
  s.unit,
  s.starting_stock,
  s.min_stock,
  s.pcs_per_dus,
  nullif(s.item_code,''),
  null
from source_items s
where not exists (
  select 1
  from public.items i
  where lower(trim(i.name)) = lower(trim(s.name))
    and lower(trim(i.category)) = lower(trim(s.category))
);

notify pgrst, 'reload schema';

-- Cek hasil import per kategori:
select category, count(*) as jumlah_item
from public.items
group by category
order by category;
