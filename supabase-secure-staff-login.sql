-- Harry's Farm - Kunci akses hanya untuk staff login Supabase Auth.
-- Jalankan setelah data/tabel sudah ada.
-- Ini menutup akses anon/public ke tabel dan hanya mengizinkan user yang sudah login.

alter table public.items enable row level security;
alter table public.stock_transactions enable row level security;

-- Bersihkan policy lama yang masih terbuka.
drop policy if exists "hf_items_select" on public.items;
drop policy if exists "hf_items_insert" on public.items;
drop policy if exists "hf_items_update" on public.items;
drop policy if exists "hf_items_delete" on public.items;

drop policy if exists "hf_tx_select" on public.stock_transactions;
drop policy if exists "hf_tx_insert" on public.stock_transactions;
drop policy if exists "hf_tx_update" on public.stock_transactions;
drop policy if exists "hf_tx_delete" on public.stock_transactions;

-- Cabut akses langsung untuk anon. Staff yang login memakai role authenticated.
revoke all on public.items from anon;
revoke all on public.stock_transactions from anon;
revoke all on all sequences in schema public from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.items to authenticated;
grant select, insert, update, delete on public.stock_transactions to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Policy staff login. Semua user Supabase Auth yang sudah login boleh akses.
create policy "hf_items_staff_select" on public.items
for select to authenticated
using (auth.role() = 'authenticated');

create policy "hf_items_staff_insert" on public.items
for insert to authenticated
with check (auth.role() = 'authenticated');

create policy "hf_items_staff_update" on public.items
for update to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "hf_items_staff_delete" on public.items
for delete to authenticated
using (auth.role() = 'authenticated');

create policy "hf_tx_staff_select" on public.stock_transactions
for select to authenticated
using (auth.role() = 'authenticated');

create policy "hf_tx_staff_insert" on public.stock_transactions
for insert to authenticated
with check (auth.role() = 'authenticated');

create policy "hf_tx_staff_update" on public.stock_transactions
for update to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "hf_tx_staff_delete" on public.stock_transactions
for delete to authenticated
using (auth.role() = 'authenticated');
