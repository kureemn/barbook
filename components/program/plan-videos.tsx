"use client";

import { useState } from "react";
import { VideoPlayer, VideoThumbnail } from "@/components/exercises/form-video";
import { exerciseVideo } from "@/lib/exercise-videos";

/** Today's exercises as pictures: tiles to swipe on a phone, a list on a large screen. */
export function PlanVideos({ rows }: { rows: { name: string; target: string }[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const video = exerciseVideo(playing ?? undefined);

  return (
    <>
      <h3 className="text-xl font-bold tracking-tight">Today&apos;s plan</h3>
      {video && (
        <div className="mt-3">
          <VideoPlayer key={video.id} video={video} onClose={() => setPlaying(null)} />
        </div>
      )}
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
        {rows.map(({ name, target }) => {
          const rowVideo = exerciseVideo(name);
          return (
            <li key={name} className="w-40 shrink-0 lg:flex lg:w-auto lg:items-center lg:gap-4 lg:border-t lg:border-tint-peach-foreground/15 lg:py-2.5">
              {rowVideo ? (
                <VideoThumbnail
                  video={rowVideo}
                  onPlay={() => setPlaying(name)}
                  className="w-full rounded-xl lg:w-28"
                />
              ) : (
                <div aria-hidden="true" className="aspect-video w-full shrink-0 rounded-xl bg-background lg:w-28" />
              )}
              <p className="mt-2 min-w-0 lg:mt-0">
                <span className="block text-sm font-medium">{name}</span>
                <span className="block text-sm tabular-nums">{target}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
