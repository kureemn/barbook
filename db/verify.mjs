// Checks the database's privacy rules by acting as real app roles, inside a
// transaction that is always rolled back, so it leaves no data behind.
//
// Usage:
//   npm run db:verify

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = readFileSync(path.resolve(__dirname, "..", ".env.local"), "utf8");
const connectionString = env.match(/^DATABASE_URL=(.*)$/m)?.[1];
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to .env.local and re-run.");
  process.exit(1);
}

const USER_A = "00000000-0000-4000-8000-00000000000a";
const USER_B = "00000000-0000-4000-8000-00000000000b";

const client = new Client({ connectionString });
let failures = 0;

function report(name, passed, detail = "") {
  if (!passed) failures++;
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? `  [${detail}]` : ""}`);
}

async function actAs(role, userId) {
  await client.query("reset role");
  const claims = userId ? JSON.stringify({ sub: userId, role }) : "";
  await client.query("select set_config('request.jwt.claims', $1, true)", [claims]);
  await client.query(`set local role ${role}`);
}

async function expectBlocked(name, sql, params, code) {
  await client.query("savepoint attempt");
  try {
    const result = await client.query(sql, params);
    report(name, false, `allowed, ${result.rowCount} rows`);
  } catch (error) {
    report(name, error.code === code, `${error.code} ${error.message.slice(0, 60)}`);
  }
  await client.query("rollback to savepoint attempt");
}

async function countRows(sql, params = []) {
  return (await client.query(sql, params)).rowCount;
}

await client.connect();
try {
  // Every table the Data API can reach must have Row Level Security on.
  const unprotected = await client.query(`
    select c.relname from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  `);
  report(
    "every public table has Row Level Security",
    unprotected.rowCount === 0,
    unprotected.rows.map((row) => row.relname).join(", ")
  );

  await client.query("begin");
  await client.query("create table verify_new_table (id integer)");
  const access = await client.query(
    "select has_table_privilege('authenticated', 'verify_new_table', 'select') as allowed"
  );
  report("a new table gets no automatic access", !access.rows[0].allowed);
  await client.query("rollback");

  await client.query("begin");
  await client.query(
    `insert into neon_auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
     values ($1, 'Test A', 'a@test.invalid', true, now(), now()),
            ($2, 'Test B', 'b@test.invalid', true, now(), now())`,
    [USER_A, USER_B]
  );

  await actAs("authenticated", USER_A);
  const exercise = (
    await client.query("insert into exercises (name, category) values ('Squat', 'squat') returning id, user_id")
  ).rows[0];
  report("user_id defaults to the signed-in user", exercise.user_id === USER_A);
  const workout = (
    await client.query("insert into workouts (title, performed_on) values ('Day 1', '2026-11-01') returning id")
  ).rows[0];
  await client.query(
    "insert into workout_sets (workout_id, exercise_id, set_number, weight, reps, rpe) values ($1, $2, 1, 300, 5, 8)",
    [workout.id, exercise.id]
  );
  report("User A sees their own workout", (await countRows("select * from workouts")) === 1);

  await client.query("insert into stars (workout_id) values ($1)", [workout.id]);
  report("User A can star their workout", (await countRows("select * from stars")) === 1);
  await expectBlocked("a workout can't be starred twice",
    "insert into stars (workout_id) values ($1)", [workout.id], "23505");

  await expectBlocked("blank title is rejected",
    "insert into workouts (title, performed_on) values ('  ', '2026-11-01')", [], "23514");
  await expectBlocked("RPE above 10 is rejected",
    "insert into workout_sets (workout_id, exercise_id, set_number, weight, reps, rpe) values ($1, $2, 2, 300, 5, 11)",
    [workout.id, exercise.id], "23514");
  await expectBlocked("zero reps is rejected",
    "insert into workout_sets (workout_id, exercise_id, set_number, weight, reps) values ($1, $2, 2, 300, 0)",
    [workout.id, exercise.id], "23514");
  await expectBlocked("duplicate exercise name is rejected",
    "insert into exercises (name, category) values ('Squat', 'squat')", [], "23505");
  await expectBlocked("an exercise with sets can't be deleted",
    "delete from exercises where id = $1", [exercise.id], "23001");

  await actAs("authenticated", USER_B);
  for (const table of ["workouts", "exercises", "workout_sets", "stars"]) {
    report(`User B sees none of User A's ${table}`, (await countRows(`select * from ${table}`)) === 0);
  }
  report("User B can't open User A's workout by id",
    (await countRows("select * from workouts where id = $1", [workout.id])) === 0);
  report("User B's update of User A's workout changes nothing",
    (await countRows("update workouts set title = 'changed' where id = $1", [workout.id])) === 0);
  report("User B's delete of User A's workout changes nothing",
    (await countRows("delete from workouts where id = $1", [workout.id])) === 0);
  await expectBlocked("User B can't create a row owned by User A",
    "insert into workouts (user_id, title, performed_on) values ($1, 'x', '2026-11-01')", [USER_A], "42501");
  const ownExercise = (
    await client.query("insert into exercises (name, category) values ('Bench', 'bench') returning id")
  ).rows[0];
  await expectBlocked("User B can't attach a set to User A's workout",
    "insert into workout_sets (workout_id, exercise_id, set_number, weight, reps) values ($1, $2, 1, 100, 1)",
    [workout.id, ownExercise.id], "23503");

  await expectBlocked("User B can't star User A's workout",
    "insert into stars (workout_id) values ($1)", [workout.id], "23503");
  await expectBlocked("User B can't create a star owned by User A",
    "insert into stars (user_id, workout_id) values ($1, $2)", [USER_A, workout.id], "42501");
  report("User B's delete of User A's star changes nothing",
    (await countRows("delete from stars where workout_id = $1", [workout.id])) === 0);

  await actAs("authenticated", null);
  report("a request with no user sees nothing", (await countRows("select * from workouts")) === 0);

  await actAs("anonymous", null);
  await client.query("savepoint attempt");
  let anonymousRows = 0;
  try {
    anonymousRows = await countRows("select * from workouts");
  } catch {
    anonymousRows = 0;
  }
  await client.query("rollback to savepoint attempt");
  report("a logged-out visitor sees nothing", anonymousRows === 0);

  await actAs("authenticated", USER_A);
  const title = (await client.query("select title from workouts where id = $1", [workout.id])).rows[0]?.title;
  report("User A's workout is unchanged", title === "Day 1");
  await client.query("delete from workouts where id = $1", [workout.id]);
  await client.query("reset role");
  report("deleting a workout deletes its sets",
    (await countRows("select * from workout_sets where workout_id = $1", [workout.id])) === 0);
  report("deleting a workout deletes its stars",
    (await countRows("select * from stars where workout_id = $1", [workout.id])) === 0);
} finally {
  await client.query("rollback").catch(() => {});
  await client.end();
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exitCode = failures === 0 ? 0 : 1;
