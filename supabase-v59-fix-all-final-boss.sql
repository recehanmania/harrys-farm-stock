-- Harry's Farm V59 - FIX ALL FINAL BOSS SQL
-- Jalankan di Supabase SQL Editor.
-- Ini SQL gabungan semua fitur final. Tidak menghapus data.
-- Kalau muncul warning, pilih: Run and enable RLS.

-- ITEMS / MASTER BARANG
alter table public.items
add column if not exists pcs_per_dus numeric not null default 0,
add column if not exists archived boolean not null default false,
add column if not exists barcode text null;

-- STOCK TRANSACTIONS / LAPORAN / KELUAR PABRIK / PRODUKSI
alter table public.stock_transactions
add column if not exists transaction_code text null,
add column if not exists keluar_dus numeric not null default 0,
add column if not exists keluar_item numeric not null default 0,
add column if not exists masuk_dus numeric not null default 0,
add column if not exists masuk_item numeric not null default 0,
add column if not exists jenis_transaksi text not null default 'stok_harian',
add column if not exists no_surat_jalan text null,
add column if not exists tujuan text null,
add column if not exists jenis_dus text null,
add column if not exists jenis_plastik text null;

-- MASTER KARYAWAN
create table if not exists public.employee_master (
  id bigserial primary key,
  name text not null,
  default_shift text not null default 'Shift 1',
  note text null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ABSEN KARYAWAN
create table if not exists public.employee_attendance (
  id bigserial primary key,
  attendance_code text null,
  date date not null default current_date,
  employee_id bigint null,
  employee_name text not null,
  shift_name text null,
  status text not null default 'Masuk',
  check_in time null,
  check_out time null,
  scheduled_in time null,
  scheduled_out time null,
  overtime boolean not null default false,
  overtime_hours numeric not null default 0,
  note text null,
  petugas text null,
  created_by uuid null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.employee_attendance
add column if not exists attendance_code text null,
add column if not exists employee_id bigint null,
add column if not exists shift_name text null,
add column if not exists scheduled_in time null,
add column if not exists scheduled_out time null,
add column if not exists overtime boolean not null default false,
add column if not exists overtime_hours numeric not null default 0;

alter table public.employee_master
add column if not exists default_shift text not null default 'Shift 1',
add column if not exists note text null,
add column if not exists active boolean not null default true;

-- CLOSING HARIAN
create table if not exists public.daily_closing (
  id bigserial primary key,
  date date not null unique,
  note text null,
  petugas text null,
  created_by uuid null default auth.uid(),
  created_at timestamptz not null default now()
);

-- FORMULA RESEP PRODUKSI
create table if not exists public.product_recipes (
  id bigserial primary key,
  product_id bigint not null,
  ingredient_item_id bigint not null,
  ingredient_name text null,
  qty_per_unit numeric not null default 0,
  unit text null,
  note text null,
  created_by uuid null default auth.uid(),
  created_at timestamptz not null default now()
);

-- INDEX
create index if not exists idx_items_barcode on public.items (barcode);
create index if not exists idx_stock_transactions_code on public.stock_transactions (transaction_code);
create index if not exists idx_stock_transactions_date_jenis on public.stock_transactions (date, jenis_transaksi);
create index if not exists idx_employee_master_name on public.employee_master (name);
create index if not exists idx_employee_master_active on public.employee_master (active);
create index if not exists idx_employee_attendance_code on public.employee_attendance (attendance_code);
create index if not exists idx_employee_attendance_date on public.employee_attendance (date desc);
create index if not exists idx_daily_closing_date on public.daily_closing (date desc);
create index if not exists idx_product_recipes_product on public.product_recipes (product_id);
create index if not exists idx_product_recipes_ingredient on public.product_recipes (ingredient_item_id);

-- RLS
alter table public.employee_master enable row level security;
alter table public.employee_attendance enable row level security;
alter table public.daily_closing enable row level security;
alter table public.product_recipes enable row level security;

-- POLICIES EMPLOYEE MASTER
drop policy if exists "employee_master_select_authenticated" on public.employee_master;
create policy "employee_master_select_authenticated"
on public.employee_master for select to authenticated using (true);

drop policy if exists "employee_master_insert_authenticated" on public.employee_master;
create policy "employee_master_insert_authenticated"
on public.employee_master for insert to authenticated with check (true);

drop policy if exists "employee_master_update_authenticated" on public.employee_master;
create policy "employee_master_update_authenticated"
on public.employee_master for update to authenticated using (true) with check (true);

-- POLICIES ATTENDANCE
drop policy if exists "employee_attendance_select_authenticated" on public.employee_attendance;
create policy "employee_attendance_select_authenticated"
on public.employee_attendance for select to authenticated using (true);

drop policy if exists "employee_attendance_insert_authenticated" on public.employee_attendance;
create policy "employee_attendance_insert_authenticated"
on public.employee_attendance for insert to authenticated with check (true);

drop policy if exists "employee_attendance_update_authenticated" on public.employee_attendance;
create policy "employee_attendance_update_authenticated"
on public.employee_attendance for update to authenticated using (true) with check (true);

drop policy if exists "employee_attendance_delete_authenticated" on public.employee_attendance;
create policy "employee_attendance_delete_authenticated"
on public.employee_attendance for delete to authenticated using (true);

-- POLICIES DAILY CLOSING
drop policy if exists "daily_closing_select_authenticated" on public.daily_closing;
create policy "daily_closing_select_authenticated"
on public.daily_closing for select to authenticated using (true);

drop policy if exists "daily_closing_insert_authenticated" on public.daily_closing;
create policy "daily_closing_insert_authenticated"
on public.daily_closing for insert to authenticated with check (true);

drop policy if exists "daily_closing_delete_authenticated" on public.daily_closing;
create policy "daily_closing_delete_authenticated"
on public.daily_closing for delete to authenticated using (true);

-- POLICIES PRODUCT RECIPES
drop policy if exists "product_recipes_select_authenticated" on public.product_recipes;
create policy "product_recipes_select_authenticated"
on public.product_recipes for select to authenticated using (true);

drop policy if exists "product_recipes_insert_authenticated" on public.product_recipes;
create policy "product_recipes_insert_authenticated"
on public.product_recipes for insert to authenticated with check (true);

drop policy if exists "product_recipes_update_authenticated" on public.product_recipes;
create policy "product_recipes_update_authenticated"
on public.product_recipes for update to authenticated using (true) with check (true);

drop policy if exists "product_recipes_delete_authenticated" on public.product_recipes;
create policy "product_recipes_delete_authenticated"
on public.product_recipes for delete to authenticated using (true);

notify pgrst, 'reload schema';

-- FINAL CHECK RESULT
select 'items' as table_name, count(*) as rows_count from public.items
union all
select 'stock_transactions', count(*) from public.stock_transactions
union all
select 'employee_master', count(*) from public.employee_master
union all
select 'employee_attendance', count(*) from public.employee_attendance
union all
select 'daily_closing', count(*) from public.daily_closing
union all
select 'product_recipes', count(*) from public.product_recipes;
