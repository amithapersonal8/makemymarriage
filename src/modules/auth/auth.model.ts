import "server-only";

import mongoose, { Schema, type Types } from "mongoose";

export type User = {
  name: string;
  normalizedEmail: string;
  passwordHash: string;
  disabledAt: Date | null;
};

export type Session = {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type RateLimit = { _id: string; count: number; expiresAt: Date };

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true, maxlength: 100 },
    normalizedEmail: { type: String, required: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    disabledAt: { type: Date, default: null },
  },
  { timestamps: true, strict: "throw", collection: "users" },
);
userSchema.index({ normalizedEmail: 1 }, { unique: true });

const sessionSchema = new Schema<Session>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, strict: "throw", collection: "sessions" },
);
sessionSchema.index({ tokenHash: 1 }, { unique: true });
sessionSchema.index({ userId: 1, revokedAt: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const rateLimitSchema = new Schema<RateLimit>(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
  },
  { strict: "throw", collection: "auth_rate_limits" },
);
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserModel = mongoose.models.User
  ? mongoose.model<User>("User")
  : mongoose.model<User>("User", userSchema);
export const SessionModel = mongoose.models.Session
  ? mongoose.model<Session>("Session")
  : mongoose.model<Session>("Session", sessionSchema);
export const RateLimitModel = mongoose.models.AuthRateLimit
  ? mongoose.model<RateLimit>("AuthRateLimit")
  : mongoose.model<RateLimit>("AuthRateLimit", rateLimitSchema);
