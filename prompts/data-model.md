# Prompts: data model

## Starting the feature

> Login worked

Sent after the agent said feature 2 was next. It opened the Issue and branch, and wrote the tables from PLAN.md section 3.

## Connecting the database

> can you do it fo rme

The agent copied the connection string from the Neon Console to `.env.local` through the clipboard, so the password never appeared in the conversation.

## A wrong diagnosis

> Yes, re-enable it

A diagnostic query failed with `permission denied for schema auth`. The agent said the privacy rules would fail the same way, and I approved turning the Data API off and back on with "Grant public schema access" checked.

That diagnosis was wrong. The rules never needed that permission, and re-enabling only gave signed-in users automatic access to new tables.

> Yes, tighten it

The agent noticed the permission hadn't changed and reported its mistake. I approved removing the automatic access.
