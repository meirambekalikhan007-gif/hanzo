-- ============================================================
-- HANZO — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "pg_trgm";   -- fast text search
create extension if not exists "uuid-ossp"; -- uuid_generate_v4()

-- ============================================================
-- PHASE 1: FOUNDATION TABLES
-- ============================================================

-- ─── profiles ───────────────────────────────────────────────
create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text        not null,
  lang        text        not null default 'en'   check (lang in ('en','ru','kz')),
  daily_goal  int         not null default 10,
  onboarding  jsonb,
  theme       text        not null default 'dark' check (theme in ('dark','light')),
  mute        boolean     not null default false,
  created_at  timestamptz not null default now()
);

comment on table profiles is 'One row per Supabase Auth user. Mirrors the hanzo S object.';

-- ─── user_words ─────────────────────────────────────────────
create table if not exists user_words (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references profiles on delete cascade,
  char       text        not null,
  pinyin     text        not null default '',
  meaning    text        not null default '',
  hsk        text        not null default 'HSK1'
                         check (hsk in ('HSK1','HSK2','HSK3','HSK4','HSK5','HSK6')),
  cat        text        not null default '',
  status     text        not null default 'new'
                         check (status in ('new','learning','mastered')),
  -- SM-2 fields
  sm2_ef     float       not null default 2.5,  -- ease factor 1.3–2.5
  sm2_rep    int         not null default 0,    -- repetition count
  sm2_iv     int         not null default 1,    -- interval days
  srs_next   date        not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, char)
);

create index if not exists user_words_user_id_idx   on user_words (user_id);
create index if not exists user_words_srs_next_idx  on user_words (user_id, srs_next);
create index if not exists user_words_status_idx    on user_words (user_id, status);

-- ─── user_phrases ────────────────────────────────────────────
create table if not exists user_phrases (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references profiles on delete cascade,
  phrase_cn  text        not null,
  phrase_py  text        not null default '',
  phrase_en  text        not null default '',
  phrase_ru  text        not null default '',
  phrase_kz  text        not null default '',
  status     text        not null default 'new'
                         check (status in ('new','learning','mastered')),
  from_bank  boolean     not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, phrase_cn)
);

create index if not exists user_phrases_user_id_idx on user_phrases (user_id);

-- ─── study_sessions ──────────────────────────────────────────
-- One row per user per calendar day. Upsert on correct answer.
create table if not exists study_sessions (
  id            uuid  primary key default gen_random_uuid(),
  user_id       uuid  not null references profiles on delete cascade,
  date          date  not null default current_date,
  correct_count int   not null default 0,
  unique (user_id, date)
);

create index if not exists study_sessions_user_date_idx on study_sessions (user_id, date desc);

-- ─── xp_log ──────────────────────────────────────────────────
-- Immutable append-only log. Total XP = sum of this table.
create table if not exists xp_log (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references profiles on delete cascade,
  amount     int         not null check (amount > 0),
  source     text        not null
             check (source in (
               'add_word','master_word','learn_word',
               'master_phrase','learn_phrase',
               'lesson_correct','lesson_complete',
               'fill_correct','tf_correct','daily_goal'
             )),
  created_at timestamptz not null default now()
);

create index if not exists xp_log_user_id_idx      on xp_log (user_id);
create index if not exists xp_log_created_at_idx   on xp_log (user_id, created_at desc);

-- ─── Helper function: get total XP for a user ────────────────
create or replace function get_user_total_xp(uid uuid)
returns int
language sql stable
as $$
  select coalesce(sum(amount), 0)::int from xp_log where user_id = uid;
$$;

-- ============================================================
-- PHASE 2: SOCIAL TABLES
-- ============================================================

-- ─── friendships ─────────────────────────────────────────────
create table if not exists friendships (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references profiles on delete cascade,
  friend_id  uuid        not null references profiles on delete cascade,
  status     text        not null default 'pending'
                         check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

create index if not exists friendships_user_id_idx   on friendships (user_id);
create index if not exists friendships_friend_id_idx on friendships (friend_id);

-- ─── nudges ──────────────────────────────────────────────────
create table if not exists nudges (
  id       uuid        primary key default gen_random_uuid(),
  from_id  uuid        not null references profiles on delete cascade,
  to_id    uuid        not null references profiles on delete cascade,
  message  text,
  seen     boolean     not null default false,
  sent_at  timestamptz not null default now(),
  check (from_id <> to_id)
);

create index if not exists nudges_to_id_idx on nudges (to_id, seen);

-- ============================================================
-- LEADERBOARD VIEW (weekly XP)
-- ============================================================

create or replace view leaderboard_weekly as
select
  p.id   as user_id,
  p.name as name,
  coalesce(sum(x.amount), 0)::int as total_xp,
  rank() over (order by coalesce(sum(x.amount), 0) desc) as rank
from profiles p
left join xp_log x
  on x.user_id = p.id
  and x.created_at >= date_trunc('week', now())
group by p.id, p.name;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- Trigger fires after a new row is inserted into auth.users
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, lang)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'lang', 'en')
  );
  return new;
end;
$$;

-- Drop existing trigger if present, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles       enable row level security;
alter table user_words     enable row level security;
alter table user_phrases   enable row level security;
alter table study_sessions enable row level security;
alter table xp_log         enable row level security;
alter table friendships    enable row level security;
alter table nudges         enable row level security;

-- ─── profiles ────────────────────────────────────────────────
create policy "profiles: owner full access"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow reading basic public profile info for leaderboard/friends
create policy "profiles: public read (name only)"
  on profiles for select
  using (true);

-- ─── user_words ──────────────────────────────────────────────
create policy "user_words: owner full access"
  on user_words for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── user_phrases ─────────────────────────────────────────────
create policy "user_phrases: owner full access"
  on user_phrases for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── study_sessions ──────────────────────────────────────────
create policy "study_sessions: owner full access"
  on study_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── xp_log ──────────────────────────────────────────────────
create policy "xp_log: owner insert"
  on xp_log for insert
  with check (auth.uid() = user_id);

create policy "xp_log: owner read"
  on xp_log for select
  using (auth.uid() = user_id);

-- ─── friendships ─────────────────────────────────────────────
create policy "friendships: owner manage"
  on friendships for all
  using (auth.uid() = user_id or auth.uid() = friend_id)
  with check (auth.uid() = user_id);

-- ─── nudges ──────────────────────────────────────────────────
create policy "nudges: sender insert"
  on nudges for insert
  with check (auth.uid() = from_id);

create policy "nudges: recipient read and mark seen"
  on nudges for all
  using (auth.uid() = to_id or auth.uid() = from_id);

-- ============================================================
-- DONE
-- Tables: profiles, user_words, user_phrases, study_sessions,
--         xp_log, friendships, nudges
-- Views:  leaderboard_weekly
-- Triggers: on_auth_user_created
-- ============================================================
