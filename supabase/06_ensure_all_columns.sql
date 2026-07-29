-- Bazadagi barcha kerakli ustunlarni tekshirish va yo'qlarini qo'shish

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS avatar text NOT NULL DEFAULT '👤';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_id uuid;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_text text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_sender text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_type text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_edited boolean default false;
