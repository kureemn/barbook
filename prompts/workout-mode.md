# Prompts: workout mode

## Starting the feature

I asked for a second look at the app from a user's point of view:

> Could you also take just a second look at think of yourself as like, you know, you're a UX designer. Just thinking about what would be intuitive. If you are someone using this app,

The agent opened a real session at phone size and measured it: 6.3 screens long, the first set more than a full screen down, 109 controls for 13 sets, 13 rest menus, and entries lost on reload. It listed six fixes in priority order and recommended building them together. I chose to build them before the docs:

> Yes, build them

## What the agent did

- Saved a draft of an in-progress workout on the device. It's removed on finish, on "Start over", on logout, or after two days.
- Added a ✓ for each set, which starts the rest automatically.
- Moved title, date, and bodyweight into a collapsed "Date and details" row above the exercises.
- Replaced the rest menu on each set with one for the whole workout.
- Collapsed muscle and equipment details to one line while logging.
- Pinned Finish workout to the bottom of the screen, and sent me home to my next session after finishing.

## Results

Measured on the same session at 375 × 667:

| | Before | After |
|---|---|---|
| Page length | 6.3 screens | 4.9 screens, shorter as sets get checked off |
| First set position | 907 px down | 532 px down, visible without scrolling |
| Controls | 109 | 95 |
| Rest menus | 13 | 1 |
| Entries after a reload | Lost | Kept |

## Decisions

- **Me:** build all six before the docs.
- **The agent:** if no sets are checked off, Finish saves everything, so typing in an old workout from my notes isn't extra work. If only some are checked off, it asks whether to save just those or all of them.
- **The agent:** the "next up" step is the home page with a confirmation message, not a new screen.
