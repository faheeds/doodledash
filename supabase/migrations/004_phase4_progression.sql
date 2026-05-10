-- Phase 4: Sketchbooks + Progression

-- level_progress: tracks which levels each user has completed and their best score
create table if not exists public.level_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  sketchbook integer not null,   -- 1, 2, 3 ...
  level integer not null,        -- 1-3 within each sketchbook (global 1-9 for SB1-3)
  completed boolean default false,
  best_score integer default 0,
  completed_at timestamptz,
  unique(user_id, sketchbook, level)
);

-- daily_doodles: one entry per user per day
create table if not exists public.daily_doodles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  display_name text,              -- denormalized for easy leaderboard queries
  prompt text not null,
  svg_data text,
  sparks_earned integer default 0,
  doodle_date date not null default current_date,
  created_at timestamptz default now(),
  unique(user_id, doodle_date)
);

-- RLS for level_progress
alter table public.level_progress enable row level security;
create policy "Anyone can read level progress" on public.level_progress for select using (true);
create policy "Users can insert own progress" on public.level_progress for insert with check (auth.uid() is not null);
create policy "Users can update own progress" on public.level_progress for update using (
  user_id in (select id from public.users where auth_id = auth.uid())
);

-- RLS for daily_doodles
alter table public.daily_doodles enable row level security;
create policy "Anyone can read daily doodles" on public.daily_doodles for select using (true);
create policy "Users can insert own doodles" on public.daily_doodles for insert with check (auth.uid() is not null);
create policy "Users can update own doodles" on public.daily_doodles for update using (
  user_id in (select id from public.users where auth_id = auth.uid())
);

-- Add style_stars column if it doesn't exist (may already be there from schema)
alter table public.users add column if not exists unlocked_frames text[] default '{"default"}';
