import Image from "next/image";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExerciseVideo } from "@/lib/exercise-videos";
import { cn } from "@/lib/utils";

/** A picture of the video. YouTube isn't contacted until it's tapped. */
export function VideoThumbnail({
  video,
  onPlay,
  className,
}: {
  video: ExerciseVideo;
  onPlay: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play form video: ${video.title}, ${video.length}`}
      className={cn(
        "relative aspect-video shrink-0 overflow-hidden rounded-md bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <Image
        src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
        alt=""
        fill
        sizes="(min-width: 640px) 240px, 128px"
        className="object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/20">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Play className="size-4 fill-current" aria-hidden="true" />
        </span>
      </span>
      <span className="absolute right-1 bottom-1 rounded-sm bg-black/75 px-1 text-xs text-white tabular-nums">
        {video.length}
      </span>
    </button>
  );
}

/** Plays inline, so the sets and rest timer are still on the page. */
export function VideoPlayer({ video, onClose }: { video: ExerciseVideo; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0`}
        title={video.title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        className="aspect-video w-full rounded-md bg-black"
      />
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <a
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 underline-offset-2 hover:underline"
        >
          {video.channel} on YouTube
        </a>
        <Button type="button" variant="ghost" onClick={onClose}>
          <X aria-hidden="true" />
          Close video
        </Button>
      </div>
    </div>
  );
}
