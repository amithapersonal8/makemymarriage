import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { AppError } from "@/lib/http/app-error";
import type { AccountUser } from "@/modules/auth/auth.dto";
import * as repository from "@/modules/auth/auth.repository";
import { loginSchema, signupSchema } from "@/modules/auth/auth.schema";
import { hashPassword, verifyPassword } from "@/modules/auth/password";

export const sessionLifetimeSeconds = 7 * 24 * 60 * 60;
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function projectUser(user: {
  _id: { toString(): string };
  name: string;
  normalizedEmail: string;
}): AccountUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.normalizedEmail,
  };
}

async function enforceLimit(
  action: string,
  identity: string,
  limit: number,
  windowSeconds: number,
) {
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const expiresAt = new Date((window + 1) * windowSeconds * 1000);
  const count = await repository.incrementRateLimit(
    `${action}:${hashToken(identity)}:${window}`,
    expiresAt,
  );
  if (count > limit)
    throw new AppError(
      429,
      "RATE_LIMITED",
      "Too many attempts. Please try again later.",
      Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)),
    );
}

async function issueSession(user: AccountUser) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionLifetimeSeconds * 1000);
  await repository.createSession(user.id, hashToken(token), expiresAt);
  return { user, token, expiresAt };
}

export async function signup(input: unknown, clientIdentity: string) {
  const data = signupSchema.parse(input);
  await repository.prepareAuthDatabase();
  await enforceLimit("signup-client", clientIdentity, 5, 3600);
  await enforceLimit("signup-global", "all", 100, 3600);
  if (await repository.findUserByEmail(data.email))
    throw new AppError(
      409,
      "EMAIL_IN_USE",
      "An account with this email already exists. Try logging in.",
    );
  const passwordHash = await hashPassword(data.password);
  try {
    const user = await repository.createUser(
      data.name,
      data.email,
      passwordHash,
    );
    return await issueSession(projectUser(user));
  } catch (error) {
    if (repository.isDuplicateKey(error))
      throw new AppError(
        409,
        "EMAIL_IN_USE",
        "An account with this email already exists. Try logging in.",
      );
    throw error;
  }
}

export async function login(input: unknown, clientIdentity: string) {
  const data = loginSchema.parse(input);
  await repository.prepareAuthDatabase();
  await enforceLimit("login-client", clientIdentity, 20, 900);
  await enforceLimit("login-email", data.email, 10, 900);
  await enforceLimit("login-global", "all", 200, 900);
  const user = await repository.findUserByEmail(data.email);
  const valid = await verifyPassword(data.password, user?.passwordHash);
  if (!user || !valid || user.disabledAt)
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  return issueSession(projectUser(user));
}

export async function getSessionUser(
  token: string | undefined,
): Promise<AccountUser | null> {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  await repository.prepareAuthDatabase();
  const user = await repository.findSessionUser(hashToken(token), new Date());
  return user ? projectUser(user) : null;
}

export async function logout(token: string | undefined) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  await repository.prepareAuthDatabase();
  await repository.revokeSession(hashToken(token));
}
