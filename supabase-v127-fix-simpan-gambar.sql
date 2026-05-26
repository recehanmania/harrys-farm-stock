-- V127 FIX SIMPAN GAMBAR STOK
-- Jalankan di Supabase SQL Editor agar gambar item tersimpan permanen
-- dan terlihat oleh semua staff/perangkat.

alter table if exists public.items
  add column if not exists image_url text;

comment on column public.items.image_url is
  'URL atau data image untuk thumbnail barang di aplikasi Harrys Farm Stock';
