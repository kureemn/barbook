// The required data isolation test. It runs against the real database rules as
// the role the app uses, with two made-up users, inside a transaction that is
// always rolled back, so it leaves nothing behind and can't touch real data.
import { readFileSync } from "node:fs";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const USER_A = "00000000-0000-4000-8000-00000000000a";
const USER_B = "00000000-0000-4000-8000-00000000000b";

function databaseUrl() {
  const url = readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1];
  if (!url) throw new Error("This test needs DATABASE_URL in .env.local.");
  return url;
}

describe("data isolation", () => {
  const db = new Client({ connectionString: databaseUrl() });
  let workoutId: string;

  // Switches to the role the app uses, signed in as this user.
  async function actAs(userId: string) {
    await db.query("reset role");
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: userId, role: "authenticated" }),
    ]);
    await db.query("set local role authenticated");
  }

  async function rowCount(sql: string, params: string[] = []) {
    return (await db.query(sql, params)).rowCount;
  }

  beforeAll(async () => {
    await db.connect();
    await db.query("begin");
    await db.query(
      `insert into neon_auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       values ($1, 'Test A', 'a@test.invalid', true, now(), now()),
              ($2, 'Test B', 'b@test.invalid', true, now(), now())`,
      [USER_A, USER_B]
    );

    await actAs(USER_A);
    const exercise = await db.query(
      "insert into exercises (name, category) values ('Squat', 'squat') returning id"
    );
    const workout = await db.query(
      "insert into workouts (title, performed_on) values ('Day 1', '2026-11-01') returning id"
    );
    workoutId = workout.rows[0].id;
    await db.query(
      "insert into workout_sets (workout_id, exercise_id, set_number, weight, reps) values ($1, $2, 1, 100, 5)",
      [workoutId, exercise.rows[0].id]
    );
    await db.query("insert into stars (workout_id) values ($1)", [workoutId]);
  }, 30_000);

  afterAll(async () => {
    await db.query("rollback");
    await db.end();
  });

  // Without this check, the tests below would also pass if nothing had been saved.
  it("User A can see their own workout", async () => {
    await actAs(USER_A);
    expect(await rowCount("select id from workouts where id = $1", [workoutId])).toBe(1);
  });

  it("User B sees an empty workouts list", async () => {
    await actAs(USER_B);
    expect(await rowCount("select id from workouts")).toBe(0);
  });

  it("User B gets no workout from User A's direct link", async () => {
    await actAs(USER_B);
    expect(await rowCount("select id from workouts where id = $1", [workoutId])).toBe(0);
  });

  it("User B can't see User A's sets, exercises, or stars", async () => {
    await actAs(USER_B);
    expect(await rowCount("select id from workout_sets")).toBe(0);
    expect(await rowCount("select id from exercises")).toBe(0);
    expect(await rowCount("select workout_id from stars")).toBe(0);
  });

  it("User B can't change or delete User A's workout", async () => {
    await actAs(USER_B);
    expect(await rowCount("update workouts set title = 'Changed' where id = $1", [workoutId])).toBe(0);
    expect(await rowCount("delete from workouts where id = $1", [workoutId])).toBe(0);

    await actAs(USER_A);
    const { rows } = await db.query("select title from workouts where id = $1", [workoutId]);
    expect(rows).toEqual([{ title: "Day 1" }]);
  });
});
