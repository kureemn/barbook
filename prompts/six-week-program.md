# Prompts: 6-week program and Start workout

## Starting the feature

> I think also like you need to start workout button and ideally like this app is modeled off of like some sort of program like think of 6-week programs or these improvements we can make.

This came from the same message as the muscle and equipment feature. The agent then asked me two questions, and I chose:

- **What should the program be?** A built-in 6-week block, over entering my own program or building a program editor, because of the Wednesday due date.
- **How many days a week?** 4 days.

## What the agent did

It wrote the program in `lib/programs.ts`, added the `program_runs` and `program_sessions` tables with privacy checks, ran the migration, and refreshed the Data API's schema cache in Neon. It added the Program page, the "Up next" card with the Start workout button, and reused the workout form, suggested weights, and rest timer for sessions.

It tested through my real login with a workout labeled "TEST": starting the program, starting a session, saving, seeing the next session, deleting the workout to reopen it, and ending the program. It then deleted that test run.

## Who decided what

- **Me:** a built-in block, 6 weeks, 4 days a week, squat, bench, and deadlift focus.
- **The agent:** the exercises on each day, and the sets, reps, and RPE each week. These come from its general knowledge and aren't from a coach or a published program, so I should check them as a lifter before relying on them.
