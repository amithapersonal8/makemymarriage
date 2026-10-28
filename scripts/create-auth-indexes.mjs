import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";
import mongoose from "mongoose";

// Explicit index migration: do not run against an unintended environment.
if (!process.env.MONGODB_URI && existsSync(".env.local"))
  loadEnvFile(".env.local");
if (!process.env.MONGODB_URI) {
  console.error("Set MONGODB_URI before creating auth indexes.");
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: false,
      autoCreate: false,
      serverSelectionTimeoutMS: 5000,
    });
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database is not connected");
    await db
      .collection("users")
      .createIndex({ normalizedEmail: 1 }, { unique: true });
    await db
      .collection("sessions")
      .createIndex({ tokenHash: 1 }, { unique: true });
    await db.collection("sessions").createIndex({ userId: 1, revokedAt: 1 });
    await db
      .collection("sessions")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db
      .collection("auth_rate_limits")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log("Auth indexes created successfully.");
  } catch {
    console.error(
      "Auth index creation failed. Check database access and existing duplicate records.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
