# Prompts: program schedule

## Starting the feature

> the program page feels pretty busy even though I like kind of the general direction of it. I feel like a lot of the pages feel busy. I like the dashboard though. That feels the cleanest.

The agent mocked up a version that showed only the current week and hid the rest behind taps. That went too far:

> kind of like the 4 weeks ahead look and seeing what's in each day. I feel like maybe this pairs it back a little too much.

So it mocked up a second version that kept the information and removed the repetition, and I said:

> Yes, build it

## What the agent did

It combined two sections, one listing each day's exercises and one with a card per week, into one table with a row per week and a column per day. Each day's name now shows once instead of once per week. Finished sessions show a check, the next one is marked, and every square still opens its session or logged workout.

Each day's exercises stay visible: under their columns on larger screens, and in a list below the table on a phone. Where the program comes from moved behind **About this program**.

## Choices it made

- **Rep schemes only on larger screens.** They don't fit a phone's table, and the targets still show when a session starts.
- **Exercise targets follow the current week**, since they change as the program goes on.
- **Long day names wrap**, like "Upper power" in PHUL, instead of being shortened as the mockup suggested.
- **The Workouts page is unchanged** until I've tried this one.
