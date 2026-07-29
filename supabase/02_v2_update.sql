-- Run this to update your existing V1 database to V2

-- 1. Jadvalga yangi ustunlarni qo'shish (Fayllar va Reply uchun)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_id uuid;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_text text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_sender text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_type text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_name text;

-- 2. Fayllarni o'qish va yozish uchun ruxsatlar (Storage Policies)
-- Diqqat: 'chat_uploads' deb nomlangan Public Storage Bucket avval yaratilgan bo'lishi kerak!
drop policy if exists "Public Access to chat_uploads" on storage.objects;
create policy "Public Access to chat_uploads" on storage.objects for select using ( bucket_id = 'chat_uploads' );

drop policy if exists "Public Insert to chat_uploads" on storage.objects;
create policy "Public Insert to chat_uploads" on storage.objects for insert with check ( bucket_id = 'chat_uploads' );

