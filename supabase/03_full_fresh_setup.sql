-- SQL schema for 'Xabarnoma' Chat application (FULL V2 SETUP)
-- Run this if you are setting up the database from scratch!

-- 1. Create the 'messages' table
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    sender_name text not null,
    avatar text not null default '👤',
    text text not null,
    
    -- New columns for V2 (Replies and Files)
    reply_to_id uuid,
    reply_to_text text,
    reply_to_sender text,
    file_url text,
    file_type text,
    file_name text,
    is_edited boolean default false
);

-- 2. Enable Row Level Security (RLS)
alter table public.messages enable row level security;

-- 3. Create RLS Policies for messages
drop policy if exists "Allow public read access" on public.messages;
create policy "Allow public read access" on public.messages for select using (true);

drop policy if exists "Allow public insert access" on public.messages;
create policy "Allow public insert access" on public.messages for insert with check (true);

drop policy if exists "Allow public update access" on public.messages;
create policy "Allow public update access" on public.messages for update using (true);



-- 4. Enable Realtime Replication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;


-- ==========================================================
-- 5. STORAGE BUCKET CONFIGURATION (For Images/Audio/Files)
-- ==========================================================
-- Make sure you manually create a bucket named 'chat_uploads' in the Supabase Dashboard,
-- and set it to "Public". Then run these policies:

-- Allow public access to view files
drop policy if exists "Public Access to chat_uploads" on storage.objects;
create policy "Public Access to chat_uploads" on storage.objects for select using ( bucket_id = 'chat_uploads' );

-- Allow public access to insert files
drop policy if exists "Public Insert to chat_uploads" on storage.objects;
create policy "Public Insert to chat_uploads" on storage.objects for insert with check ( bucket_id = 'chat_uploads' );

