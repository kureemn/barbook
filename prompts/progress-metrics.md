# Prompts: progress metrics

## Starting the feature

> I think the dashboard. Estimated reps can be cool, but like also just like I don't know, think of other kind of metrics that could be helpful to know if you're a lifter want to see your progress over time.

## What the agent chose

It looked at what my logged sets can support without guessing, and added:

- **Your lifts:** each main lift's best estimate, change since I first logged it, and heaviest set.
- **Recent records:** days any exercise beat its best estimated 1-rep max. The first time logging an exercise sets a baseline and doesn't count.
- **Weekly volume and sessions per week:** the last 8 weeks, including empty weeks.
- **Weeks in a row:** a streak that an unfinished week doesn't break.
- **Sets per muscle:** the last 30 days, with every muscle listed so a neglected one shows as 0. It's shown on the body diagram too.
- **Total vs. bodyweight:** best estimated total divided by my latest logged bodyweight.

The calculations are in `lib/progress.ts` with tests in `tests/progress.test.ts`. Each new trend chart has a table view.

## Decisions

- **Me:** the dashboard should show more than estimated 1-rep max.
- **The agent:** which metrics to add, and leaving out strength standards, comparisons to other lifters, and scores like DOTS, which need information the app doesn't store.
- **The agent:** records compare estimated 1-rep max, not raw weight. Sets per muscle counts only each exercise's main muscles, based on the same list as the exercise details.

## Limits

With 2 logged workouts, the trends don't say much yet. Everything comes from what's logged, so a mistake in a logged set carries into these numbers.
