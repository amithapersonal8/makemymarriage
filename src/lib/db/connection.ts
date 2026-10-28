import "server-only";

import mongoose from "mongoose";

import { AppError } from "@/lib/http/app-error";

// Reuse a connection across requests and development hot reloads.
const databaseState = globalThis as typeof globalThis & {
  marriageDatabase?: Promise<typeof mongoose>;
};

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new AppError(
      503,
      "SERVICE_UNAVAILABLE",
      "Account access is temporarily unavailable. Please try again later.",
    );
  }

  databaseState.marriageDatabase ??= mongoose
    .connect(uri, {
      autoIndex: false,
      autoCreate: false,
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    })
    .catch(() => {
      databaseState.marriageDatabase = undefined;
      throw new AppError(
        503,
        "SERVICE_UNAVAILABLE",
        "Account access is temporarily unavailable. Please try again later.",
      );
    });
  return databaseState.marriageDatabase;
}
