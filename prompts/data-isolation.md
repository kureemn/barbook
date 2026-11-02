# Prompts: data isolation test

## Starting the test

> Yes, do isolation test

Sent after the agent asked whether to do this required test next. The test is described in section 4 of `PLAN.md`.

## What the agent did

It wrote a test that acts as two made-up users against the real database rules, inside a transaction that is always undone. To show it can fail, it replaced the privacy rule on workouts for one run, inside that same transaction, captured the failure, removed the change, and captured the pass.
