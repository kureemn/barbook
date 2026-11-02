# Prompts: dashboard

## Starting the feature

> I have two added now.

Sent after the agent asked whether to start the dashboard while I entered my workouts, and told me 2-3 workouts on different dates were enough to build against. The dashboard itself is described in `PLAN.md`: a chart of estimated 1-rep max over time for squat, bench, and deadlift, plus workouts this month, volume over the last 30 days, and best estimated total.

## What the agent did

It wrote the calculations and tests first, including the required 860 test from `PLAN.md`, then built the page and chart. It temporarily removed the warm-up filter to capture a failing test, restored it, and captured the pass. It checked the stats against my two real workouts without changing them.
