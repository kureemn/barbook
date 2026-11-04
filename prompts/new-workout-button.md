# Prompts: new workout button

## Where it came from

A tester outside the class signed up on the live app and used it for 10 minutes without help. In their review they said:

> How do I create a new workout? All it says is "Start Workout, but there's a small button that says "Log a different workout." That was a bit hard to find.

The agent first recommended explaining RPE, since the tester never got past that one. I pushed back:

> okay but it's such a minor fix, was there nothing else?

The agent said this struggle was easier to defend as the most important, because logging a workout is the app's core job and the tester asked outright how to do it. I decided:

> yes, let's do the new workout link, change it

## What the agent did

With a program running, Start workout opens the next session, so the only way to log anything else was a small text link. It replaced that link with a full-width New workout button directly under Start workout, and renamed it to match the tester's own words.

## Choices it made

- **The new button is an outline, not filled.** Start workout stays the main action for someone following a program.
- **No change with no program running.** Start workout already opens an empty workout there, so a second button would do the same thing twice.

## The follow-up

After that merged, I looked at it and wrote:

> The thing that confused me was like the difference between start workout and log a new workout. And I don't think this makes that distinction.

I was right: PR #66 made the second option easier to find, but "Start workout" and "New workout" still sounded like the same thing. The agent renamed them to say what each does. The main button now names the session, like "Start Day 2", and the second says "Start empty workout" with a line explaining it's for choosing your own exercises or logging a past workout.
