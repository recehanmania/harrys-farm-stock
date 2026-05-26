-- V125: tambah kolom gambar per item di master stok
alter table if exists public.items
  add column if not exists image_url text;

comment on column public.items.image_url is
  'URL atau data image (base64) untuk thumbnail barang di aplikasi stok';
