-- Xabarlarni o'chirish (DELETE) uchun ruxsat berish
drop policy if exists "Allow public delete access" on public.messages;
create policy "Allow public delete access" on public.messages for delete using (true);
