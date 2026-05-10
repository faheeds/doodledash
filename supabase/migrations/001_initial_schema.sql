-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS table
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_frame text default 'default',
  sparks integer default 0,
  style_stars integer default 0,
  sketchbook_level integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MATCHES table
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  room_code text unique not null,
  status text default 'lobby' check (status in ('lobby','drawing','voting','results','finished')),
  current_round integer default 0,
  total_rounds integer default 5,
  current_prompt text,
  host_user_id uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MATCH_PLAYERS join table
create table if not exists public.match_players (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references public.matches(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  is_bot boolean default false,
  score integer default 0,
  joined_at timestamptz default now(),
  unique(match_id, user_id)
);

-- DRAWINGS table
create table if not exists public.drawings (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references public.matches(id) on delete cascade,
  player_id uuid references public.users(id) on delete cascade,
  round_number integer not null,
  prompt text not null,
  image_url text,
  ai_score integer,
  ai_feedback text,
  is_moderated boolean default false,
  is_flagged boolean default false,
  created_at timestamptz default now()
);

-- VOTES table
create table if not exists public.votes (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references public.matches(id) on delete cascade,
  voter_id uuid references public.users(id) on delete cascade,
  drawing_id uuid references public.drawings(id) on delete cascade,
  round_number integer not null,
  category text check (category in ('most_creative','funniest','best_match')),
  created_at timestamptz default now(),
  unique(match_id, voter_id, category, round_number)
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.drawings enable row level security;
alter table public.votes enable row level security;

-- Basic RLS policies
create policy "Users can read all profiles" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = auth_id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = auth_id);

create policy "Anyone can read matches" on public.matches for select using (true);
create policy "Authenticated users can create matches" on public.matches for insert with check (auth.role() = 'authenticated');
create policy "Host can update match" on public.matches for update using (
  host_user_id in (select id from public.users where auth_id = auth.uid())
);

create policy "Anyone can read match players" on public.match_players for select using (true);
create policy "Players can join matches" on public.match_players for insert with check (auth.role() = 'authenticated');

create policy "Anyone can read drawings" on public.drawings for select using (is_flagged = false);
create policy "Players can insert drawings" on public.drawings for insert with check (auth.role() = 'authenticated');

create policy "Players can read votes" on public.votes for select using (true);
create policy "Players can cast votes" on public.votes for insert with check (auth.role() = 'authenticated');

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on public.users
  for each row execute function update_updated_at();
create trigger matches_updated_at before update on public.matches
  for each row execute function update_updated_at();
