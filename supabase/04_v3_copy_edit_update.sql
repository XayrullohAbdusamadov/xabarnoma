-- Run this to update your database for the Copy & Edit (V3) features

-- 1. Jadvalga xabarning tahrirlanganligini bildiruvchi ustun qo'shish
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_edited boolean default false;

-- 2. Xabarlarni tahrirlash (UPDATE) uchun ruxsat berish
drop policy if exists "Allow public update access" on public.messages;
create policy "Allow public update access" on public.messages for update using (true);
