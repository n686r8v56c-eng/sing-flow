-- Execute once in Supabase SQL Editor. No existing tables or data are removed.
create table if not exists public.vocal_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  app_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.vocal_profiles enable row level security;
drop policy if exists "vocal_read_own" on public.vocal_profiles;
create policy "vocal_read_own" on public.vocal_profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "vocal_insert_own" on public.vocal_profiles;
create policy "vocal_insert_own" on public.vocal_profiles for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "vocal_update_own" on public.vocal_profiles;
create policy "vocal_update_own" on public.vocal_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
insert into storage.buckets(id,name,public,file_size_limit) values ('vocal-media','vocal-media',false,52428800) on conflict(id) do nothing;
drop policy if exists "vocal_upload_own" on storage.objects;
create policy "vocal_upload_own" on storage.objects for insert to authenticated with check (bucket_id='vocal-media' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "vocal_read_media_own" on storage.objects;
create policy "vocal_read_media_own" on storage.objects for select to authenticated using (bucket_id='vocal-media' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "vocal_delete_media_own" on storage.objects;
create policy "vocal_delete_media_own" on storage.objects for delete to authenticated using (bucket_id='vocal-media' and (storage.foldername(name))[1]=auth.uid()::text);
