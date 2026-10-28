import "server-only";

import { connectDatabase } from "@/lib/db/connection";
import {
  RateLimitModel,
  SessionModel,
  UserModel,
} from "@/modules/auth/auth.model";

let developmentIndexes: Promise<unknown> | undefined;
export async function prepareAuthDatabase() {
  await connectDatabase();
  // Production indexes are deliberately created with pnpm db:indexes before serving traffic.
  if (process.env.NODE_ENV !== "production") {
    developmentIndexes ??= Promise.all([
      UserModel.createIndexes(),
      SessionModel.createIndexes(),
      RateLimitModel.createIndexes(),
    ]).catch((error) => {
      developmentIndexes = undefined;
      throw error;
    });
    await developmentIndexes;
  }
}

export async function findUserByEmail(normalizedEmail: string) {
  return UserModel.findOne({ normalizedEmail }).select("+passwordHash").exec();
}

export async function createUser(
  name: string,
  normalizedEmail: string,
  passwordHash: string,
) {
  return UserModel.create({ name, normalizedEmail, passwordHash });
}

export async function createSession(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) {
  return SessionModel.create({ userId, tokenHash, expiresAt });
}

export async function findSessionUser(tokenHash: string, now: Date) {
  const session = await SessionModel.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: now },
  })
    .lean()
    .exec();
  if (!session) return null;
  return UserModel.findOne({ _id: session.userId, disabledAt: null }).exec();
}

export async function revokeSession(tokenHash: string) {
  await SessionModel.updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  ).exec();
}

export async function incrementRateLimit(key: string, expiresAt: Date) {
  // Fixed-window key + unique _id: increments remain atomic across server instances.
  try {
    const row = await RateLimitModel.findOneAndUpdate(
      { _id: key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: "after" },
    )
      .lean()
      .exec();
    return row.count;
  } catch (error) {
    if (isDuplicateKey(error)) {
      const row = await RateLimitModel.findOneAndUpdate(
        { _id: key },
        { $inc: { count: 1 } },
        { returnDocument: "after" },
      )
        .lean()
        .exec();
      if (row) return row.count;
    }
    throw error;
  }
}

export function isDuplicateKey(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}
