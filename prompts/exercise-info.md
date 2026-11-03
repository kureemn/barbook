# Prompts: exercise info

## Starting the feature

> Can we work on the visual aesthetics of this? I think a great thing is like when we can like from FitBot, you can see how certain apps what muscles and exercise targets, you also see pictures of equipment so that could be helpful just to know what you're targeting. I think also like you need to start workout button and ideally like this app is modeled off of like some sort of program like think of 6-week programs or these improvements we can make.

This one message led to three features. This log covers the muscles and equipment. The 6-week program and the visual polish have their own Issues, branches, and prompt logs.

## What the agent did

It wrote down the main and supporting muscles and the equipment for all 34 starter exercises in `lib/exercise-info.ts`, and drew a body diagram and equipment pictures as SVGs for this app rather than copying images from another app. They show under the exercise when logging and when viewing a saved workout. It tested them on my real workout through my login.

## Decisions

- The agent chose to keep this in code, not the database, because these facts are the same for every lifter. An exercise I add myself shows nothing rather than a guess.
- The muscle choices are the agent's general knowledge. I should check them against what I know as a lifter.
