-- Create scrape_history table to store all scraping results
create table if not exists public.scrape_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text,
  sections jsonb not null default '[]'::jsonb,
  js_rendering boolean not null default false,
  interactions jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.scrape_history enable row level security;

-- RLS Policies: Users can only access their own scrape history
create policy "Users can view their own scrape history"
  on public.scrape_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own scrape history"
  on public.scrape_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own scrape history"
  on public.scrape_history for update
  using (auth.uid() = user_id);

create policy "Users can delete their own scrape history"
  on public.scrape_history for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index scrape_history_user_id_idx on public.scrape_history(user_id);
create index scrape_history_created_at_idx on public.scrape_history(created_at desc);
