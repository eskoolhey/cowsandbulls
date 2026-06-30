-- Run this entire file in Supabase SQL Editor (Project > SQL Editor > New query > paste > Run)

create table rooms (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  digits integer not null default 5,
  status text not null default 'waiting',  -- waiting | setup | playing | won
  current_turn text default 'player1',     -- player1 | player2
  winner text default null,                -- player1 | player2

  player1_secret text default null,
  player2_secret text default null,
  player1_ready boolean default false,
  player2_ready boolean default false,

  player1_training boolean default false,
  player2_training boolean default false,

  player1_guesses jsonb default '[]'::jsonb,
  player2_guesses jsonb default '[]'::jsonb,

  created_at timestamp with time zone default now()
);

-- Enable real-time updates for the rooms table
alter publication supabase_realtime add table rooms;

-- Public game, no login required — allow anyone to read/write rooms
alter table rooms enable row level security;

create policy "Anyone can read rooms" on rooms for select using (true);
create policy "Anyone can insert rooms" on rooms for insert with check (true);
create policy "Anyone can update rooms" on rooms for update using (true);
