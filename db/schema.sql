-- Barbook tables, Row Level Security policies, and grants.
-- Safe to re-run with `npm run db:migrate`: every statement is idempotent.
--
-- After adding a table or column, click "Refresh schema cache" on the Neon
-- Console's Data API page, or the Data API rejects queries that use it.
--
-- Accounts live in neon_auth."user", managed by Neon Auth. Every table here
-- stores the owner's id in user_id, which defaults to the signed-in user.
-- auth.user_id() returns text and the account id is a uuid, hence the casts.

-- New objects get no automatic access. A table is reachable only through its
-- own grant below, so one that's missing its policies fails closed.
alter default privileges in schema public revoke all on tables from authenticated;
alter default privileges in schema public revoke all on sequences from authenticated;
alter default privileges in schema public revoke all on functions from authenticated;

-- Exercises: the lifts a user trains, such as "Competition squat".
create table if not exists exercises (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.user_id()::uuid references neon_auth."user" (id) on delete cascade,
  name        text not null,
  category    text not null,
  created_at  timestamptz not null default now(),

  constraint exercises_name_not_blank check (length(btrim(name)) > 0),
  constraint exercises_category_valid
    check (category in ('squat', 'bench', 'deadlift', 'accessory')),
  constraint exercises_name_unique_per_user unique (user_id, name),
  -- Lets workout_sets require that a set's exercise has the same owner.
  constraint exercises_id_owner_unique unique (id, user_id)
);

-- Workouts: one training session on one date.
create table if not exists workouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.user_id()::uuid references neon_auth."user" (id) on delete cascade,
  title         text not null,
  performed_on  date not null,
  bodyweight    numeric(5, 1),
  notes         text,
  created_at    timestamptz not null default now(),

  constraint workouts_title_not_blank check (length(btrim(title)) > 0),
  constraint workouts_bodyweight_positive check (bodyweight is null or bodyweight > 0),
  constraint workouts_id_owner_unique unique (id, user_id)
);

create index if not exists workouts_user_date_idx on workouts (user_id, performed_on desc);

-- Workout sets: one row per set, connecting a workout to an exercise.
-- Weights are in pounds.
create table if not exists workout_sets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.user_id()::uuid references neon_auth."user" (id) on delete cascade,
  workout_id   uuid not null,
  exercise_id  uuid not null,
  set_number   integer not null,
  weight       numeric(6, 2) not null,
  reps         integer not null,
  rpe          numeric(3, 1),
  is_warmup    boolean not null default false,

  -- Foreign keys ignore Row Level Security, so including user_id here is what
  -- stops a user attaching a set to someone else's workout or exercise.
  constraint workout_sets_workout_fk foreign key (workout_id, user_id)
    references workouts (id, user_id) on delete cascade,
  constraint workout_sets_exercise_fk foreign key (exercise_id, user_id)
    references exercises (id, user_id) on delete restrict,
  constraint workout_sets_number_positive check (set_number > 0),
  constraint workout_sets_weight_not_negative check (weight >= 0),
  constraint workout_sets_reps_positive check (reps > 0),
  constraint workout_sets_rpe_range check (rpe is null or rpe between 6 and 10)
);

create index if not exists workout_sets_workout_idx on workout_sets (workout_id);
create index if not exists workout_sets_owner_exercise_idx on workout_sets (user_id, exercise_id);

-- Stars: one table for everyone, where each row means "this user starred this
-- workout". The two-column primary key means a workout can't be starred twice,
-- and the foreign key means only the workout's owner can star it.
create table if not exists stars (
  user_id     uuid not null default auth.user_id()::uuid references neon_auth."user" (id) on delete cascade,
  workout_id  uuid not null,
  created_at  timestamptz not null default now(),

  primary key (user_id, workout_id),
  constraint stars_workout_fk foreign key (workout_id, user_id)
    references workouts (id, user_id) on delete cascade
);

-- Templates: a reusable program day, such as "Squat day".
create table if not exists templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.user_id()::uuid references neon_auth."user" (id) on delete cascade,
  name        text not null,
  notes       text,
  created_at  timestamptz not null default now(),

  constraint templates_name_not_blank check (length(btrim(name)) > 0),
  constraint templates_id_owner_unique unique (id, user_id)
);

-- Template exercises: one row per exercise in a template, with its targets.
create table if not exists template_exercises (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.user_id()::uuid references neon_auth."user" (id) on delete cascade,
  template_id  uuid not null,
  exercise_id  uuid not null,
  position     integer not null,
  target_sets  integer not null,
  target_reps  integer not null,
  target_rpe   numeric(3, 1),

  constraint template_exercises_template_fk foreign key (template_id, user_id)
    references templates (id, user_id) on delete cascade,
  constraint template_exercises_exercise_fk foreign key (exercise_id, user_id)
    references exercises (id, user_id) on delete restrict,
  constraint template_exercises_position_positive check (position > 0),
  constraint template_exercises_sets_range check (target_sets between 1 and 20),
  constraint template_exercises_reps_positive check (target_reps > 0),
  constraint template_exercises_rpe_range check (target_rpe is null or target_rpe between 6 and 10)
);

create index if not exists template_exercises_template_idx on template_exercises (template_id);

-- A workout can remember the template it started from. Deleting a template
-- keeps the workout: only template_id is cleared, not user_id.
alter table workouts add column if not exists template_id uuid;
alter table workouts drop constraint if exists workouts_template_fk;
alter table workouts add constraint workouts_template_fk foreign key (template_id, user_id)
  references templates (id, user_id) on delete set null (template_id);

-- Program runs: one row each time a lifter starts a program. The program's
-- weeks and targets live in lib/programs.ts, since they're the same for everyone.
create table if not exists program_runs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.user_id()::uuid references neon_auth."user" (id) on delete cascade,
  program_key  text not null,
  started_on   date not null,
  ended_on     date,
  created_at   timestamptz not null default now(),

  constraint program_runs_dates_valid check (ended_on is null or ended_on >= started_on),
  constraint program_runs_id_owner_unique unique (id, user_id)
);

-- Which programs exist. Kept apart from the table so adding one updates existing databases.
alter table program_runs drop constraint if exists program_runs_key_valid;
alter table program_runs add constraint program_runs_key_valid
  check (program_key in ('six-week-strength', 'five-three-one-bbb', 'phul'));

-- Only one program can be running at a time. Ended runs stay as history.
create unique index if not exists program_runs_one_active_idx
  on program_runs (user_id) where ended_on is null;

-- Program sessions: one row per finished session, tying it to the workout logged
-- for it. Deleting that workout removes the row, which reopens the session.
create table if not exists program_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.user_id()::uuid references neon_auth."user" (id) on delete cascade,
  run_id      uuid not null,
  week        integer not null,
  day         integer not null,
  workout_id  uuid not null,

  constraint program_sessions_run_fk foreign key (run_id, user_id)
    references program_runs (id, user_id) on delete cascade,
  constraint program_sessions_workout_fk foreign key (workout_id, user_id)
    references workouts (id, user_id) on delete cascade,
  constraint program_sessions_week_range check (week between 1 and 6),
  constraint program_sessions_day_range check (day between 1 and 4),
  constraint program_sessions_once unique (run_id, week, day),
  constraint program_sessions_workout_once unique (workout_id)
);

-- Row Level Security: a signed-in user reaches only rows where user_id is theirs.
-- USING picks which existing rows qualify. WITH CHECK tests the row after a
-- write, so nobody can hand a row to another account.
do $$
declare
  t text;
begin
  foreach t in array array['exercises', 'workouts', 'workout_sets', 'templates', 'template_exercises', 'program_runs', 'program_sessions'] loop
    execute format('alter table %I enable row level security', t);

    execute format('drop policy if exists %I on %I', t || '_select_own', t);
    execute format(
      'create policy %I on %I for select to authenticated using (auth.user_id()::uuid = user_id)',
      t || '_select_own', t);

    execute format('drop policy if exists %I on %I', t || '_insert_own', t);
    execute format(
      'create policy %I on %I for insert to authenticated with check (auth.user_id()::uuid = user_id)',
      t || '_insert_own', t);

    execute format('drop policy if exists %I on %I', t || '_update_own', t);
    execute format(
      'create policy %I on %I for update to authenticated using (auth.user_id()::uuid = user_id) with check (auth.user_id()::uuid = user_id)',
      t || '_update_own', t);

    execute format('drop policy if exists %I on %I', t || '_delete_own', t);
    execute format(
      'create policy %I on %I for delete to authenticated using (auth.user_id()::uuid = user_id)',
      t || '_delete_own', t);

    -- Policies choose rows, but the role still needs permission on the table.
    execute format('grant select, insert, update, delete on %I to authenticated', t);
  end loop;
end
$$;

-- A star is only ever added or removed, so it has no update policy or grant.
alter table stars enable row level security;

drop policy if exists stars_select_own on stars;
create policy stars_select_own on stars
  for select to authenticated using (auth.user_id()::uuid = user_id);

drop policy if exists stars_insert_own on stars;
create policy stars_insert_own on stars
  for insert to authenticated with check (auth.user_id()::uuid = user_id);

drop policy if exists stars_delete_own on stars;
create policy stars_delete_own on stars
  for delete to authenticated using (auth.user_id()::uuid = user_id);

grant select, insert, delete on stars to authenticated;
