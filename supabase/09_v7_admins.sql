-- Adminlar ro'yxati jadvalini yaratish
CREATE TABLE IF NOT EXISTS public.admins (
    username text PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) faollashtirish
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Siyosatlar (Policies)
DROP POLICY IF EXISTS "Allow public read access" ON public.admins;
CREATE POLICY "Allow public read access" ON public.admins FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON public.admins;
CREATE POLICY "Allow public insert access" ON public.admins FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access" ON public.admins;
CREATE POLICY "Allow public delete access" ON public.admins FOR DELETE USING (true);

-- Realtime-ga qo'shish
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'admins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admins;
  END IF;
END $$;
