-- Harry's Farm V76 - Lokasi QC Otomatis
-- Sama seperti V74, pastikan kolom data pabrik sudah ada.
alter table public.items
add column if not exists lokasi text null,
add column if not exists supplier text null,
add column if not exists qc_status text not null default 'OK',
add column if not exists batch_lot text null,
add column if not exists expired_date date null;

create index if not exists idx_items_lokasi on public.items (lokasi);
create index if not exists idx_items_qc_status on public.items (qc_status);
create index if not exists idx_items_expired_date on public.items (expired_date);

notify pgrst, 'reload schema';
