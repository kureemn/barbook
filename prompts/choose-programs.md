# Prompts: choose programs

## Starting the feature

> last thing is, after this, is there another program or how do you change programs? Is that an option? Maybe you might want to focus on something else. Also, what is the source of this program? That might be interesting

The agent explained that it wrote the existing program itself from general knowledge, and that there was no way to switch. I then asked:

> Well, you can search the internet for like different programs. I do like the program that you came up with. I don't think it's authoritative. I just think it might be interesting if you kind of wanted to switch it up or was wondering if it was following a particular thing. So we'll do this, and that'll be the last change that we'll do, and then we'll write the doc.

## What the agent did

It searched for well-known programs and added two that fit a 4-day week, alongside the existing block:

- **5/3/1 with Boring But Big**, based on Jim Wendler's program, for steady strength.
- **PHUL**, based on Brandon Campbell's program, for building muscle.

It considered the Candito 6-week program and GZCLP and left them out. Sources disagreed on Candito's details and it depends on a percentage spreadsheet, and GZCLP is aimed at beginners.

Each program now shows where it comes from, what Barbook changed, and source links. I can switch programs at any time, and finishing one leads to choosing the next.

## Limits on the sources

- The original Muscle & Strength PHUL article blocked automated reading, so PHUL's details come from Hevy's write-up.
- The 5/3/1 percentages come from a Lift Vault summary, not Wendler's own book. The order of days, assistance exercises, and using 50% for 5 × 10 are the agent's choices.
- Both programs are simplified to fit the app, and the app says how.

## A bug caught by checking the math

5/3/1 sets log without RPE, which the app counts as all-out. So a routine 170 × 1 would have looked like a 170 lb max and lowered the next training max. The agent caught this while checking the saved numbers by hand and changed the training max to use the best logged set.
