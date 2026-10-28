import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address.").max(254));
const password = z
  .string()
  .min(15, "Use at least 15 characters for your password.")
  .max(128, "Use no more than 128 characters.")
  .refine(
    (value) => value.trim().length > 0,
    "Choose a password with more than spaces.",
  );

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter your name.")
      .max(100, "Use no more than 100 characters.")
      .regex(/^[^\u0000-\u001f\u007f]+$/, "Enter a valid name."),
    email,
    password,
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z
      .string()
      .min(1, "Enter your password.")
      .max(128, "Use no more than 128 characters."),
  })
  .strict();
