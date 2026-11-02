"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LIFTS, type E1rmPoint } from "@/lib/dashboard";

function toTime(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function shortDate(time: number) {
  return new Date(time).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type TooltipProps = {
  active?: boolean;
  payload?: readonly { payload?: E1rmPoint & { time: number } }[];
};

function ChartTooltip({ active, payload }: TooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="font-medium">{shortDate(point.time)}</p>
      <ul className="mt-1 flex flex-col gap-1">
        {LIFTS.filter((lift) => point[lift.category] !== undefined).map((lift) => (
          <li key={lift.category} className="flex items-center gap-2 tabular-nums">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: lift.color }}
            />
            {lift.label}: {Math.round(point[lift.category] as number)} lb
          </li>
        ))}
      </ul>
    </div>
  );
}

export function E1rmChart({ history }: { history: E1rmPoint[] }) {
  const data = history.map((point) => ({ ...point, time: toTime(point.date) }));
  const times = data.map((point) => point.time);

  return (
    <div>
      <ul aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {LIFTS.map((lift) => (
          <li key={lift.category} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: lift.color }} />
            {lift.label}
          </li>
        ))}
      </ul>
      <div
        role="img"
        aria-label="Line chart of estimated 1-rep max over time. The same numbers are in the table below."
        className="mt-3 h-72"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={times.length <= 6 ? times : undefined}
              tickFormatter={shortDate}
              padding={{ left: 24, right: 24 }}
              stroke="var(--border)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              width={44}
              domain={[(min: number) => Math.floor(min / 50) * 50, (max: number) => Math.ceil(max / 50) * 50]}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--muted-foreground)" }} />
            {LIFTS.map((lift) => (
              <Line
                key={lift.category}
                dataKey={lift.category}
                name={lift.label}
                stroke={lift.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, fill: lift.color, stroke: "var(--card)", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: lift.color, stroke: "var(--card)", strokeWidth: 2 }}
                // A workout without this lift shouldn't break its line.
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
