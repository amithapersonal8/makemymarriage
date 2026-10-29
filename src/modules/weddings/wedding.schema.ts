import { z } from "zod";

const dateOnly = z.string().refine((value) => {
  if (!value) return true;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < "1900-01-01" ||
    value > "2199-12-31"
  )
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}, "Enter a valid date between 1900 and 2199.");

export const weddingSchema = z
  .strictObject({
    brideName: z.string().trim().min(1, "Enter the bride’s name.").max(100),
    groomName: z.string().trim().min(1, "Enter the groom’s name.").max(100),
    title: z.string().trim().min(1, "Enter a wedding title.").max(160),
    startDate: dateOnly.default(""),
    endDate: dateOnly.default(""),
    location: z.string().trim().max(200).default(""),
    timezone: z
      .string()
      .max(100)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: value });
          return value.includes("/") || value === "UTC";
        } catch {
          return false;
        }
      }, "Choose a valid IANA timezone."),
    description: z.string().trim().max(2000).default(""),
  })
  .superRefine((data, context) => {
    if (data.endDate && !data.startDate)
      context.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Choose a start date when setting an end date.",
      });
    if (data.startDate && data.endDate && data.endDate < data.startDate)
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be on or after the start date.",
      });
  });

export type WeddingInput = z.infer<typeof weddingSchema>;
