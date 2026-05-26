-- Harry's Farm V50 - Final Check
-- Tidak ada tabel baru dari V49.
-- Jalankan hanya untuk memastikan schema lengkap.

alter table public.items
add column if not exists pcs_per_dus numeric not null default 0,
add column if not exists archived boolean not null default false;

alter table public.stock_transactions
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

notify pgrst, 'reload schema';
