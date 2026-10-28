import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { NextRequest } from "next/server";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  accountAccessResponse,
  currentUserResponse,
  logoutResponse,
  sessionCookieName,
  sessionCookieOptions,
} from "@/modules/auth/auth.http";
import {
  RateLimitModel,
  SessionModel,
  UserModel,
} from "@/modules/auth/auth.model";
import { prepareAuthDatabase } from "@/modules/auth/auth.repository";
import {
  getSessionUser,
  hashToken,
  login,
  logout,
  sessionLifetimeSeconds,
  signup,
} from "@/modules/auth/auth.service";
import { verifyPassword } from "@/modules/auth/password";

const credentials = {
  name: "Ananya",
  email: "ananya@example.test",
  password: "a memorable wedding passphrase",
};
let database: MongoMemoryServer;
function request(
  path: string,
  body?: unknown,
  origin: string | null = "http://127.0.0.1:3000",
  token?: string,
) {
  return new NextRequest(`http://127.0.0.1:3000/api/v1/auth/${path}`, {
    method: path === "me" ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
      ...(token ? { Cookie: `${sessionCookieName()}=${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeAll(async () => {
  database = await MongoMemoryServer.create();
  vi.stubEnv("MONGODB_URI", database.getUri("auth_tests"));
  vi.stubEnv("APP_ORIGIN", "http://127.0.0.1:3000");
  await prepareAuthDatabase();
});
beforeEach(async () => {
  await Promise.all([
    UserModel.deleteMany({}),
    SessionModel.deleteMany({}),
    RateLimitModel.deleteMany({}),
  ]);
});
afterAll(async () => {
  await mongoose.disconnect();
  await database?.stop();
  vi.unstubAllEnvs();
});

describe("account access and persistence", () => {
  it("normalizes identity, stores a costly password hash and only a hashed session secret", async () => {
    const result = await signup(
      { ...credentials, email: "  ANANYA@EXAMPLE.TEST  ", name: " Ananya " },
      "client-a",
    );
    expect(result.user).toEqual({
      id: expect.any(String),
      name: "Ananya",
      email: credentials.email,
    });
    const user = await UserModel.findOne().select("+passwordHash").lean();
    const session = await SessionModel.findOne().select("+tokenHash").lean();
    expect(user?.passwordHash).toMatch(/^scrypt:131072:8:1:/);
    expect(await verifyPassword(credentials.password, user?.passwordHash)).toBe(
      true,
    );
    expect(session?.tokenHash).toBe(hashToken(result.token));
    expect(session?.tokenHash).not.toBe(result.token);
    expect(result.expiresAt.getTime() - Date.now()).toBeGreaterThan(
      (sessionLifetimeSeconds - 10) * 1000,
    );
    expect(await getSessionUser(result.token)).toEqual(result.user);
    expect((await UserModel.findOne().lean())?.passwordHash).toBeUndefined();
  });

  it("rejects duplicate normalized emails, including concurrent signup", async () => {
    const results = await Promise.allSettled([
      signup(credentials, "client-a"),
      signup({ ...credentials, email: "ANANYA@example.test" }, "client-b"),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(await UserModel.countDocuments()).toBe(1);
    expect(await SessionModel.countDocuments()).toBe(1);
  });

  it("logs in with a new token and gives the same generic error for unknown email or wrong password", async () => {
    const first = await signup(credentials, "client-a");
    const second = await login(
      { email: "ANANYA@example.test", password: credentials.password },
      "client-b",
    );
    expect(second.token).not.toBe(first.token);
    expect(second.user).toEqual(first.user);
    for (const email of [credentials.email, "unknown@example.test"]) {
      await expect(
        login({ email, password: "a wrong password" }, "client-c"),
      ).rejects.toMatchObject({
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect.",
      });
    }
  });

  it("rejects missing, malformed, forged, expired, revoked, and disabled-user sessions", async () => {
    expect(await getSessionUser(undefined)).toBeNull();
    expect(await getSessionUser("malformed")).toBeNull();
    expect(await getSessionUser("a".repeat(43))).toBeNull();
    const result = await signup(credentials, "client-a");
    await SessionModel.updateOne(
      { tokenHash: hashToken(result.token) },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );
    expect(await getSessionUser(result.token)).toBeNull();
    await SessionModel.updateOne(
      { tokenHash: hashToken(result.token) },
      {
        $set: {
          expiresAt: new Date(Date.now() + 60000),
          revokedAt: new Date(),
        },
      },
    );
    expect(await getSessionUser(result.token)).toBeNull();
    await SessionModel.updateOne(
      { tokenHash: hashToken(result.token) },
      { $set: { revokedAt: null } },
    );
    await UserModel.updateOne(
      { normalizedEmail: credentials.email },
      { $set: { disabledAt: new Date() } },
    );
    expect(await getSessionUser(result.token)).toBeNull();
    await expect(
      login(
        { email: credentials.email, password: credentials.password },
        "client-b",
      ),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("makes logout idempotent and revokes the session in MongoDB", async () => {
    const result = await signup(credentials, "client-a");
    await logout(result.token);
    await logout(result.token);
    expect(await getSessionUser(result.token)).toBeNull();
    expect((await SessionModel.findOne().lean())?.revokedAt).toBeInstanceOf(
      Date,
    );
  });
});

describe("HTTP boundaries", () => {
  it("limits login attempts per normalized email even when the client changes", async () => {
    const window = Math.floor(Date.now() / 900000);
    await RateLimitModel.create({
      _id: `login-email:${hashToken(credentials.email)}:${window}`,
      count: 10,
      expiresAt: new Date((window + 1) * 900000),
    });
    await expect(
      login(
        { email: "ANANYA@example.test", password: credentials.password },
        "new-client",
      ),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(await SessionModel.countDocuments()).toBe(0);
  });

  it("rejects cross-origin or missing-origin mutations before creating an account", async () => {
    for (const origin of [null, "https://attacker.example"]) {
      const response = await accountAccessResponse(
        request("signup", credentials, origin),
        "signup",
      );
      expect(response.status).toBe(403);
      expect(response.cookies.get(sessionCookieName())).toBeUndefined();
    }
    const crossSite = request("signup", credentials);
    crossSite.headers.set("sec-fetch-site", "cross-site");
    expect((await accountAccessResponse(crossSite, "signup")).status).toBe(403);
    expect(await UserModel.countDocuments()).toBe(0);
  });

  it("validates passwords and rejects role injection, malformed JSON, oversized payloads, and wrong content types", async () => {
    expect(
      (
        await accountAccessResponse(
          request("signup", { ...credentials, password: "too-short" }),
          "signup",
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await accountAccessResponse(
          request("signup", { ...credentials, role: "OWNER" }),
          "signup",
        )
      ).status,
    ).toBe(422);
    const malformed = new NextRequest(
      "http://127.0.0.1:3000/api/v1/auth/signup",
      {
        method: "POST",
        headers: {
          Origin: "http://127.0.0.1:3000",
          "Content-Type": "application/json",
        },
        body: "{",
      },
    );
    expect((await accountAccessResponse(malformed, "signup")).status).toBe(400);
    expect(
      (
        await accountAccessResponse(
          request("signup", { ...credentials, name: "a".repeat(17000) }),
          "signup",
        )
      ).status,
    ).toBe(413);
    const text = request("signup", credentials);
    text.headers.set("content-type", "text/plain");
    expect((await accountAccessResponse(text, "signup")).status).toBe(415);
    expect(await UserModel.countDocuments()).toBe(0);
  });

  it("sets an HttpOnly cookie, projects safe responses, prevents caching, and clears/revokes on logout", async () => {
    const response = await accountAccessResponse(
      request("signup", credentials),
      "signup",
    );
    expect(response.status).toBe(201);
    const cookie = response.cookies.get(sessionCookieName());
    expect(cookie?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    expect(response.headers.get("cache-control")).toContain("no-store");
    const body = await response.text();
    expect(body).not.toMatch(/passwordHash|tokenHash|scrypt|expiresAt/);
    expect(body).not.toContain(cookie?.value ?? "raw-token");
    const token = cookie?.value;
    expect(
      (await currentUserResponse(request("me", undefined, null, token))).status,
    ).toBe(200);
    const loggedOut = await logoutResponse(
      request("logout", undefined, undefined, token),
    );
    expect(loggedOut.status).toBe(204);
    expect(loggedOut.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(
      (await currentUserResponse(request("me", undefined, null, token))).status,
    ).toBe(401);
  });

  it("uses a Secure host-only cookie and fails closed without an origin in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ORIGIN", "");
    try {
      expect(sessionCookieName()).toBe("__Host-mmm_session");
      expect(sessionCookieOptions()).toMatchObject({
        secure: true,
        httpOnly: true,
        path: "/",
      });
      expect(
        (await accountAccessResponse(request("signup", credentials), "signup"))
          .status,
      ).toBe(503);
    } finally {
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("APP_ORIGIN", "http://127.0.0.1:3000");
    }
  });

  it("returns a safe 503 without a configured database URI", async () => {
    vi.stubEnv("MONGODB_URI", "");
    try {
      const response = await accountAccessResponse(
        request("signup", credentials),
        "signup",
      );
      expect(response.status).toBe(503);
      expect(await response.text()).not.toMatch(
        /mongodb|password|stack|MONGODB_URI/,
      );
    } finally {
      vi.stubEnv("MONGODB_URI", database.getUri("auth_tests"));
    }
  });

  it("enforces persistent limits and ignores spoofed client-forwarded headers", async () => {
    for (let i = 0; i < 5; i++) {
      // Duplicate attempts consume the same shared client bucket, without extra hashing.
      const response = await accountAccessResponse(
        request("signup", credentials),
        "signup",
      );
      expect(response.status).toBe(i === 0 ? 201 : 409);
    }
    const spoof = request("signup", {
      ...credentials,
      email: "another@example.test",
    });
    spoof.headers.set("x-forwarded-for", "192.0.2.1");
    const response = await accountAccessResponse(spoof, "signup");
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(await UserModel.countDocuments()).toBe(1);
  });
});
