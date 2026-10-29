import type { WeddingInput } from "./wedding.schema";

export type WeddingRole = "OWNER" | "ADMIN" | "MANAGER";
export type WeddingDto = WeddingInput & { id: string; role: WeddingRole };

export function weddingDateLabel(start: string, end: string) {
  const format = (date: string) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${date}T00:00:00Z`));
  if (!start) return "Not decided yet";
  return end && end !== start
    ? `${format(start)} – ${format(end)}`
    : format(start);
}
