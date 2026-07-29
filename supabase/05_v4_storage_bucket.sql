-- 1. Rasm va fayllar uchun 'chat_uploads' papkasini (Bucket) yaratish
insert into storage.buckets (id, name, public) 
values ('chat_uploads', 'chat_uploads', true)
on conflict (id) do nothing;

-- 2. Unga hamma rasm yuklashi va o'qishi uchun ruxsat berish
drop policy if exists "Public Access to chat_uploads" on storage.objects;
create policy "Public Access to chat_uploads" on storage.objects for select using ( bucket_id = 'chat_uploads' );

drop policy if exists "Public Insert to chat_uploads" on storage.objects;
create policy "Public Insert to chat_uploads" on storage.objects for insert with check ( bucket_id = 'chat_uploads' );
