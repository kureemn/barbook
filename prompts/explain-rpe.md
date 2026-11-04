# Prompts: explain RPE

## Where it came from

A tester outside the class signed up on the live app and used it for 10 minutes without help. In their review they said:

> I don't know what RPE stands for.

Later in the same review:

> I know RPE. I don't know.

They never found out during the session. The agent sorted the review into struggles and opinions and recommended fixing this one first. I chose it with:

> Fix RPE

## What the agent did

It added a short explanation above the exercises on the workout form, so it's visible without tapping anything:

> RPE means rate of perceived exertion: how hard a set felt, from 6 to 10. 10 means no reps left, 8 means 2 left. A blank RPE counts as 10 in your estimated max.

The template form shows the first part, since a blank target there doesn't affect an estimate. Screen readers now hear what the RPE field means.

## Choices it made

- **Always visible, not behind an info button.** The tester didn't know the term, so they wouldn't know to go looking.
- **Once per workout, not on every set**, so a long session doesn't get longer.
- **The text sits beside the estimated max formula in `lib/dashboard.ts`.** A test fails if the explanation stops matching the formula.

## Why I care about the blank case

A blank RPE counts as all-out in the estimated max. Someone skipping a field they don't understand would get an estimate that could be off without knowing why.
