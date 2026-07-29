-- Bloklangan foydalanuvchilar jadvalini yaratish
CREATE TABLE IF NOT EXISTS public.blocked_users (
    username text PRIMARY KEY,
    blocked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) faollashtirish
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Siyosatlar (Policies)
DROP POLICY IF EXISTS "Allow public read access" ON public.blocked_users;
CREATE POLICY "Allow public read access" ON public.blocked_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON public.blocked_users;
CREATE POLICY "Allow public insert access" ON public.blocked_users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access" ON public.blocked_users;
CREATE POLICY "Allow public delete access" ON public.blocked_users FOR DELETE USING (true);

-- Realtime-ga qo'shish
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'blocked_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_users;
  END IF;
END $$;
