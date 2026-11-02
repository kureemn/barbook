# Prompts: find things

## Starting the feature

> Okay, so my due date is Wednesday, but I already have things like in my notes app that I use to log my workouts since this isn't fully built out yet. So I can just transfer that. And I also worked out today, so I'll have enough. And yeah, let me know if there's anything else I need to do before we move on to the search filtering.

The agent had just asked whether to start feature 6, as described in `PLAN.md`: search by title, filter by exercise, and sort by newest, oldest, or highest volume.

## What the agent did

It built the search, filter, and sort in the shared workout list, so they work on both the All and Starred views, and added unit tests for the logic. It then tested them through my real login using three workouts labeled "TEST find", which it then deleted.
