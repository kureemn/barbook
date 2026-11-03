# Prompts: form videos

## Starting the feature

> for the start the workout. Is there a way to make it more visual? I mean, I do like the quads, like the muscles it targets. Is there like are there videos we can embed throughout? Just like I feel like I'm often trying to correct my form. Even if they're like short videos those have always been helpful. And then like

That message was cut off, so anything after "And then like" isn't part of this PR.

## What the agent did

It searched YouTube for each of the 34 starter exercises and picked one video for each, all under 4 minutes. It preferred powerlifting coaches for the main lifts. It confirmed through YouTube's oEmbed service that all 34 exist and allow embedding.

During a workout, each exercise now shows a video thumbnail and a small body diagram without opening anything. A tapped video plays inside the page, so the sets and rest timer stay there. The workout detail page shows the same video.

## Choices it made

- **Nothing from YouTube until tapped.** Thumbnails come through Barbook's own image route, and the player uses YouTube's privacy-enhanced domain.
- **A hand-picked list in the code**, not a live search, so a video can't change to something random during a workout. An exercise I added myself shows no video.

## Limits

- The agent read titles and channels but didn't watch all 34 videos, so I should replace any whose coaching I disagree with.
- A video could later be deleted by its owner. The list would need updating then.
