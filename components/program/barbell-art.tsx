const PLATE_HEIGHTS = [68, 68, 56, 44, 34, 24];

/** A side-on barbell. The heaviest plate is red, like a competition 25. */
export function BarbellArt({ plates }: { plates: number }) {
  const loaded = PLATE_HEIGHTS.slice(0, plates);
  return (
    <svg viewBox="0 0 360 72" className="block h-auto w-full" fill="currentColor" aria-hidden="true">
      <rect x="0" y="34" width="360" height="4" />
      <rect x="116" y="27" width="6" height="18" rx="1.5" />
      <rect x="238" y="27" width="6" height="18" rx="1.5" />
      {loaded.flatMap((height, index) => {
        const fill = index === 0 ? "var(--primary)" : undefined;
        const y = 36 - height / 2;
        return [
          <rect key={`l${index}`} x={103 - index * 13} y={y} width="11" height={height} rx="2.5" fill={fill} />,
          <rect key={`r${index}`} x={246 + index * 13} y={y} width="11" height={height} rx="2.5" fill={fill} />,
        ];
      })}
    </svg>
  );
}
