-- Harry's Farm V47 - Absen Karyawan
-- Jalankan di Supabase SQL Editor.
-- Membuat tabel absen karyawan untuk aplikasi.

create table if not exists public.employee_attendance (
  id bigserial primary key,
  date date not null default current_date,
  employee_name text not null,
  status text not null default 'Masuk',
  check_in time null,
  check_out time null,
  note text null,
  petugas text null,
  created_by uuid null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_employee_attendance_date
on public.employee_attendance (date desc);

create index if not exists idx_employee_attendance_employee
on public.employee_attendance (employee_name);

alter table public.employee_attendance enable row level security;

drop policy if exists "employee_attendance_select_authenticated" on public.employee_attendance;
create policy "employee_attendance_select_authenticated"
on public.employee_attendance
for select
to authenticated
using (true);

drop policy if exists "employee_attendance_insert_authenticated" on public.employee_attendance;
create policy "employee_attendance_insert_authenticated"
on public.employee_attendance
for insert
to authenticated
with check (true);

drop policy if exists "employee_attendance_update_authenticated" on public.employee_attendance;
create policy "employee_attendance_update_authenticated"
on public.employee_attendance
for update
to authenticated
using (true)
with check (true);

drop policy if exists "employee_attendance_delete_authenticated" on public.employee_attendance;
create policy "employee_attendance_delete_authenticated"
on public.employee_attendance
for delete
to authenticated
using (true);

notify pgrst, 'reload schema';

-- Cek tabel:
select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name='employee_attendance'
order by ordinal_position;
