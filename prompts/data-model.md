# Prompts: data model

## Starting the feature

> Login worked

Sent after the agent said feature 2 was next. It opened the Issue and branch, and wrote the tables from PLAN.md section 3.

## Connecting the database

> can you do it fo rme

The agent copied the connection string from the Neon Console to `.env.local` through the clipboard, so the password never appeared in the conversation.

## Fixing a permissions problem

> Yes, re-enable it

Testing as a signed-in user showed `permission denied for schema auth`. The agent had left Neon's "Grant public schema access" off, and it explained the trade-off before I approved turning the Data API off and back on with the option checked.
