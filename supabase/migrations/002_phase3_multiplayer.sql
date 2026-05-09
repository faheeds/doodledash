-- Phase 3: Multiplayer additions

-- Add svg_data column to drawings
alter table public.drawings add column if not exists svg_data text;

-- Add is_ready + display_name to match_players
alter table public.match_players add column if not exists is_ready boolean default false;
alter table public.match_players add column if not exists display_name text;

-- match_players policies
drop policy if exists "Host can manage match players" on public.match_players;
create policy "Host can manage match players" on public.match_players for update
  using (
    match_id in (
      select id from public.matches
      where host_user_id in (select id from public.users where auth_id = auth.uid())
    )
  );

drop policy if exists "Players can join matches" on public.match_players;
create policy "Players can join matches" on public.match_players for insert
  with check (auth.uid() is not null);

drop policy if exists "Players can update own ready status" on public.match_players;
create policy "Players can update own ready status" on public.match_players for update
  using (user_id in (select id from public.users where auth_id = auth.uid()));

-- drawings policies
drop policy if exists "Players can insert drawings" on public.drawings;
create policy "Players can insert drawings" on public.drawings for insert
  with check (auth.uid() is not null);

drop policy if exists "Players can update own drawings" on public.drawings;
create policy "Players can update own drawings" on public.drawings for update
  using (player_id in (select id from public.users where auth_id = auth.uid()));

-- votes policies
drop policy if exists "Players can cast votes" on public.votes;
create policy "Players can cast votes" on public.votes for insert
  with check (auth.uid() is not null);

-- matches policies
drop policy if exists "Host can update match" on public.matches;
create policy "Host can update match" on public.matches for update
  using (auth.uid() is not null);

drop policy if exists "Authenticated users can create matches" on public.matches;
create policy "Authenticated users can create matches" on public.matches for insert
  with check (auth.uid() is not null);

-- users policies
drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile" on public.users for insert
  with check (auth.uid() is not null);

-- Enable Realtime
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_players;
alter publication supabase_realtime add table public.drawings;
