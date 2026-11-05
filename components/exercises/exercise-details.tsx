"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { EquipmentPicture } from "@/components/exercises/equipment-picture";
import { FormCues } from "@/components/exercises/form-cues";
import { VideoPlayer, VideoThumbnail } from "@/components/exercises/form-video";
import { MuscleMap } from "@/components/exercises/muscle-map";
import { EQUIPMENT_NAMES, exerciseInfo, MUSCLE_NAMES, type ExerciseInfo } from "@/lib/exercise-info";
import { exerciseCues } from "@/lib/exercise-cues";
import { exerciseVideo } from "@/lib/exercise-videos";

/**
 * What an exercise trains, what it needs, and how it's done. Shows nothing for one the
 * lifter added. Collapsed, the equipment stays out of the way of the sets until tapped.
 */
export function ExerciseDetails({
  name,
  collapsed = false,
}: {
  name: string | undefined;
  collapsed?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const info = exerciseInfo(name);
  const video = exerciseVideo(name);
  const cues = exerciseCues(name);
  if (!info) return null;

  if (collapsed) {
    return (
      <div className="flex flex-col gap-2 rounded-md bg-muted/60 p-2">
        <div className="flex items-center gap-3">
          {video && !playing && (
            <VideoThumbnail video={video} onPlay={() => setPlaying(true)} className="w-28 sm:w-36" />
          )}
          <MuscleMap info={info} size="sm" />
          <p className="min-w-0 text-sm font-medium">
            {info.main.map((muscle) => MUSCLE_NAMES[muscle]).join(", ")}
          </p>
        </div>
        {video && playing && <VideoPlayer video={video} onClose={() => setPlaying(false)} />}
        {cues && <FormCues cues={cues} />}
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md px-1 text-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0">
              {info.equipment.map((equipment) => EQUIPMENT_NAMES[equipment]).join(", ")}
            </span>
            <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="px-1 pb-2">
            <Details info={info} />
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md bg-muted/60 p-3">
      <Details info={info} />
      {video &&
        (playing ? (
          <VideoPlayer video={video} onClose={() => setPlaying(false)} />
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <VideoThumbnail video={video} onPlay={() => setPlaying(true)} className="w-28 sm:w-36" />
            <p className="min-w-0">
              Check your form
              <span className="block text-xs text-muted-foreground">{video.channel}</span>
            </p>
          </div>
        ))}
      {cues && <FormCues cues={cues} />}
    </div>
  );
}

function Details({ info }: { info: ExerciseInfo }) {
  return (
    <div className="flex gap-4">
      <MuscleMap info={info} />
      <div className="flex min-w-0 flex-col gap-3 text-sm">
        <dl className="flex flex-col gap-1">
          <div>
            <dt className="inline font-medium">
              <span
                className="mr-1.5 inline-block size-2.5 rounded-full bg-(--muscle-main)"
                aria-hidden="true"
              />
              Main:{" "}
            </dt>
            <dd className="inline">{info.main.map((muscle) => MUSCLE_NAMES[muscle]).join(", ")}</dd>
          </div>
          {info.also.length > 0 && (
            <div>
              <dt className="inline font-medium">
                <span
                  className="mr-1.5 inline-block size-2.5 rounded-full bg-(--muscle-also)"
                  aria-hidden="true"
                />
                Also:{" "}
              </dt>
              <dd className="inline text-muted-foreground">
                {info.also.map((muscle) => MUSCLE_NAMES[muscle]).join(", ")}
              </dd>
            </div>
          )}
        </dl>
        <ul aria-label="Equipment" className="flex flex-wrap gap-3">
          {info.equipment.map((equipment) => (
            <li key={equipment} className="flex flex-col items-center gap-1 text-xs">
              <EquipmentPicture equipment={equipment} />
              {EQUIPMENT_NAMES[equipment]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
