# Prompts: Workouts page redesign

## Starting the feature

After the first round of visual polish, I sent a screenshot of the Workouts page with this prompt:

> Look at the attached screenshot of my fitness app. Something about the page feels off to me. It feels dark and plain, but I'm having trouble naming exactly why. Help me figure out what's causing that before changing the design.
>
> First, tell me where your eye goes when you look at the screen, what you think the main user action is, and whether those two things line up. Point to two or three specific details in the screenshot that explain your read. Consider the colors, type sizes, spacing, and whether too many elements look equally important.
>
> Then choose one visual direction that would make this feel brighter, more athletic, and more distinctive. Be specific about what you'd change on this screen. Which element should become the focal point? Which details should be quieter? Where would a lighter surface or a single accent color make the biggest difference? I'd like the app to have some personality while staying easy to scan on a phone during a workout.
>
> Show me the redesigned screen using my existing content and features. If you have access to the codebase, implement the redesign on this page. Otherwise, create a visual prototype I can preview. Afterward, briefly explain the three changes that made the biggest difference.

## What the agent found

It measured the page's colors. Cards were only 1.11:1 against the page, so surfaces barely separated. The filter dropdowns were lighter than the cards (1.30:1) and took up more space than the Start workout button, and "Workouts" and "Ready to lift?" looked almost the same.

## What the agent did

- Made the hero a chalk card with very large type and a full-width Start workout button.
- Moved to one brighter accent, `#f03e1f`, which keeps at least 4.5:1 with the button's charcoal text.
- Added a barbell drawing that gains one plate per finished program week.
- Put the exercise and sort filters behind a Filters button, and turned workout cards into rows.

## My feedback on the first version

> Something about how the tabs are just kind of like it's just my logout name at the top and then bar book, whatever we're calling it. And then like these tabs just next to each other. Almost feels like it's out of place. And then searching workouts by title I know I've been adding titles, but I guess more importantly, what does the title get at? I don't know, like it's not typically how I go about my workouts. And then, yeah, something about this does feel still a little dark.

The agent then:

- Moved the tabs into one top bar with the logo and Log out. Phones keep the bottom tab bar.
- Made search find exercises and muscles as well as titles, and made titles optional. A workout with no title is named after its exercises.
- Switched the whole app to a light theme with a red hero card, and validated darker chart colors for the white background.

## Decisions

The direction was the agent's choice, as I asked. The PR stayed open until I reviewed it.
