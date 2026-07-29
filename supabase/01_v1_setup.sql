-- 1. Create the 'messages' table
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    sender_name text not null,
    avatar text not null default '👤',
    text text not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.messages enable row level security;

-- 3. Create RLS Policies
drop policy if exists "Allow public read access" on public.messages;
create policy "Allow public read access"
on public.messages for select using (true);

drop policy if exists "Allow public insert access" on public.messages;
create policy "Allow public insert access"
on public.messages for insert with check (true);


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

    