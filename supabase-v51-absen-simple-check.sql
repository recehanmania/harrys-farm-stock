-- Harry's Farm V51 - Absen Simple
-- Tidak ada tabel baru dari V48/V50.
-- Jalankan hanya kalau tabel absen/master karyawan belum aktif.

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

alter table public.employee_attendance
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

notify pgrst, 'reload schema';
