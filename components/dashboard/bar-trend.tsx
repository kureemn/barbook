"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { label: string; value: number };

type TooltipProps = {
  active?: boolean;
  payload?: readonly { payload?: Point }[];
};

/** One measure over time, with the same numbers in a table for anyone who can't read the bars. */
export function BarTrend({
  data,
  valueName,
  format,
  description,
}: {
  data: Point[];
  valueName: string;
  format: (value: number) => string;
  description: string;
}) {
  function ChartTooltip({ active, payload }: TooltipProps) {
    const point = payload?.[0]?.payload;
    if (!active || !point) return null;
    return (
      <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
        <p className="font-medium">Week of {point.label}</p>
        <p className="mt-1 tabular-nums">{format(point.value)}</p>
      </div>
    );
  }

  return (
    <div>
      <div role="img" aria-label={`${description} The same numbers are in the table below.`} className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              stroke="var(--border)"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              width={44}
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) =>
                value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value)
              }
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip content={ChartTooltip} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
          Show as a table
        </summary>
        <table className="w-full text-left text-sm tabular-nums">
          <thead className="text-muted-foreground">
            <tr>
              <th scope="col" className="py-2 pr-4 font-medium">
                Week of
              </th>
              <th scope="col" className="py-2 font-medium">
                {valueName}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.label} className="border-t">
                <th scope="row" className="py-2 pr-4 font-normal">
                  {point.label}
                </th>
                <td className="py-2">{format(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
