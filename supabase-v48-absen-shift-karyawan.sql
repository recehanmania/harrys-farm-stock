-- Harry's Farm V48 - Absen Shift Karyawan
-- Jalankan di Supabase SQL Editor.
-- Fitur:
-- - Master 9 karyawan awal, bisa ditambah dan diedit.
-- - Shift 1: 07:00 - 16:00
-- - Shift 2: 15:00 - 00:00 / 12 malam
-- - Lembur dan keterangan absen.

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

-- Seed 9 orang awal. Nanti ganti nama lewat menu Absen > Master Karyawan.
insert into public.employee_master (name, default_shift, note, active)
select 'Karyawan 1', 'Shift 1', 'Edit nama asli di aplikasi', true
where not exists (select 1 from public.employee_master where name='Karyawan 1');

insert into public.employee_master (name, default_shift, note, active)
select 'Karyawan 2', 'Shift 1', 'Edit nama asli di aplikasi', true
where not exists (select 1 from public.employee_master where name='Karyawan 2');

insert into public.employee_master (name, default_shift, note, active)
select 'Karyawan 3', 'Shift 1', 'Edit nama asli di aplikasi', true
where not exists (select 1 from public.employee_master where name='Karyawan 3');

insert into public.employee_master (name, default_shift, note, active)
select 'Karyawan 4', 'Shift 1', 'Edit nama asli di aplikasi', true
where not exists (select 1 from public.employee_master where name='Karyawan 4');

insert into public.employee_master (name, default_shift, note, active)
select 'Karyawan 5', 'Shift 1', 'Edit nama asli di aplikasi', true
where not exists (select 1 from public.employee_master where name='Karyawan 5');

insert into public.employee_master (name, default_shift, note, active)
select 'Karyawan 6', 'Shift 2', 'Edit nama asli di aplikasi', true
where not exists (select 1 from public.employee_master where name='Karyawan 6');

insert into public.employee_master (name, default_shift, note, active)
select 'Karyawan 7', 'Shift 2', 'Edit nama asli di aplikasi', true
where not exists (select 1 from public.employee_master where name='Karyawan 7');

insert into public.employee_master (name, default_shift, note, active)
select 'Karyawan 8', 'Shift 2', 'Edit nama asli di aplikasi', true
where not exists (select 1 from public.employee_master where name='Karyawan 8');

insert into public.employee_master (name, default_shift, note, active)
select 'Karyawan 9', 'Shift 2', 'Edit nama asli di aplikasi', true
where not exists (select 1 from public.employee_master where name='Karyawan 9');

create index if not exists idx_employee_master_name on public.employee_master (name);
create index if not exists idx_employee_master_active on public.employee_master (active);
create index if not exists idx_employee_attendance_date on public.employee_attendance (date desc);
create index if not exists idx_employee_attendance_employee on public.employee_attendance (employee_name);

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

drop policy if exists "employee_master_delete_authenticated" on public.employee_master;
create policy "employee_master_delete_authenticated"
on public.employee_master for delete to authenticated using (true);

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

-- Cek master karyawan:
select id, name, default_shift, note, active
from public.employee_master
order by name;
