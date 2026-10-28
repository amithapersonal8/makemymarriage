const paths = {
  calendar:
    "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Zm2 10h3m4 0h3m-10 4h3",
  people:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  wallet:
    "M20 8V5H5a2 2 0 0 1 0-4h13v4M3 3v16a2 2 0 0 0 2 2h15V8H5a2 2 0 0 1-2-2m17 7h-5v4h5m-3-2h.01",
  mail: "M3 5h18v14H3V5Zm0 1 9 7 9-7",
  vendor:
    "M3 10h18l-2-7H5l-2 7Zm1 0v11h16V10M9 21v-7h6v7M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0",
  website: "M3 4h18v16H3V4Zm0 5h18M6 6.5h.01m3 0h.01M7 13h5m-5 3h9",
  camera: "M3 6h4l2-3h6l2 3h4v15H3V6Zm13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  heart: "m12 21-8-8C-2 7 6-1 12 6c6-7 14 1 8 7l-8 8Z",
  shield: "M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Zm-4 10 3 3 5-6",
  check: "m5 12 4 4L19 6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  sparkle: "m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z",
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
