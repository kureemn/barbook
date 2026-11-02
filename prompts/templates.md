# Prompts: templates

## Starting the feature

> Yes, start templates

Sent after the agent asked whether to start feature 8. The feature is described in `PLAN.md`: build a reusable template (exercises with target sets, reps, and RPE) and start a workout from it.

## What the agent did

It added the `templates` and `template_exercises` tables and `workouts.template_id`, with privacy checks, ran the migration, and refreshed the Data API's schema cache in Neon. It then built the template pages and the "Start workout" flow, and tested them through my real login using a template and workout labeled "TEST", which it then deleted.
