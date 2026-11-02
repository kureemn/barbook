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

-- Row Level Security: a signed-in user reaches only rows where user_id is theirs.
-- USING picks which existing rows qualify. WITH CHECK tests the row after a
-- write, so nobody can hand a row to another account.
do $$
declare
  t text;
begin
  foreach t in array array['exercises', 'workouts', 'workout_sets'] loop
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
