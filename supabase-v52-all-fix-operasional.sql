-- Harry's Farm V52 - All Fix Operasional
-- Jalankan di Supabase SQL Editor.
-- Fitur:
-- 1) Blok stok minus di aplikasi
-- 2) Closing harian
-- 3) Rekap absen bulanan
-- 4) Nomor transaksi otomatis
-- 5) Print laporan harian lengkap
-- 6) Role Admin/Staff di UI aplikasi
-- 7) Rekap produksi harian

alter table public.items
add column if not exists pcs_per_dus numeric not null default 0,
add column if not exists archived boolean not null default false;

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

create table if not exists public.employee_master (
  id bigserial primary key,
  name text not null,
  default_shift text not null default 'Shift 1',
  note text null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

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

create table if not exists public.daily_closing (
  id bigserial primary key,
  date date not null unique,
  note text null,
  petugas text null,
  created_by uuid null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_transactions_code on public.stock_transactions (transaction_code);
create index if not exists idx_stock_transactions_date_jenis on public.stock_transactions (date, jenis_transaksi);
create index if not exists idx_employee_attendance_code on public.employee_attendance (attendance_code);
create index if not exists idx_employee_attendance_date on public.employee_attendance (date desc);
create index if not exists idx_daily_closing_date on public.daily_closing (date desc);

alter table public.daily_closing enable row level security;

drop policy if exists "daily_closing_select_authenticated" on public.daily_closing;
create policy "daily_closing_select_authenticated"
on public.daily_closing for select to authenticated using (true);

drop policy if exists "daily_closing_insert_authenticated" on public.daily_closing;
create policy "daily_closing_insert_authenticated"
on public.daily_closing for insert to authenticated with check (true);

drop policy if exists "daily_closing_delete_authenticated" on public.daily_closing;
create policy "daily_closing_delete_authenticated"
on public.daily_closing for delete to authenticated using (true);

-- Pastikan employee_master dan employee_attendance tetap punya RLS jika tabel baru dibuat.
alter table public.employee_master enable row level security;
alter table public.employee_attendance enable row level security;

drop policy if exists "employee_master_select_authenticated" on public.employee_master;
create policy "employee_master_select_authenticated"
on public.employee_master for select to authenticated using (true);

drop policy if exists "employee_master_insert_authenticated" on public.employee_master;
create policy "employee_master_insert_authenticated"
on public.employee_master for insert to authenticated with check (true);

drop policy if exists "employee_master_update_authenticated" on public.employee_master;
create policy "employee_master_update_authenticated"
on public.employee_master for update to authenticated using (true) with check (true);

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

notify pgrst, 'reload schema';

-- Cek ringkas:
select 'stock_transactions' as table_name, column_name
from information_schema.columns
where table_schema='public' and table_name='stock_transactions' and column_name in ('transaction_code','jenis_transaksi','jenis_dus','jenis_plastik')
union all
select 'employee_attendance', column_name
from information_schema.columns
where table_schema='public' and table_name='employee_attendance' and column_name in ('attendance_code','overtime_hours')
union all
select 'daily_closing', column_name
from information_schema.columns
where table_schema='public' and table_name='daily_closing';
