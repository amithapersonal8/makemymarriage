import "server-only";

import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError } from "@/lib/http/app-error";
import {
  getSessionUser,
  login,
  logout,
  sessionLifetimeSeconds,
  signup,
} from "@/modules/auth/auth.service";

export function sessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Host-mmm_session"
    : "mmm_session";
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionLifetimeSeconds,
  };
}

export function assertSameOrigin(request: Request) {
  const configuredOrigin =
    process.env.APP_ORIGIN ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "http://127.0.0.1:3000");
  if (!configuredOrigin)
    throw new AppError(
      503,
      "SERVICE_UNAVAILABLE",
      "Account access is temporarily unavailable. Please try again later.",
    );
  if (
    request.headers.get("origin") !== new URL(configuredOrigin).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "This request could not be verified. Reload the page and try again.",
    );
  }
}

export async function readJson(request: Request): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !==
    "application/json"
  )
    throw new AppError(415, "UNSUPPORTED_MEDIA", "Send a JSON request.");
  const reader = request.body?.getReader();
  if (!reader)
    throw new AppError(
      400,
      "INVALID_JSON",
      "Enter the required account details.",
    );
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        throw new AppError(
          413,
          "PAYLOAD_TOO_LARGE",
          "The request is too large.",
        );
      }
      chunks.push(value);
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new AppError(
        400,
        "INVALID_JSON",
        "The request could not be read. Please try again.",
      );
    }
  } finally {
    reader.releaseLock();
  }
}

function clientIdentity(request: Request) {
  // Vercel supplies this header. Never trust arbitrary client X-Forwarded-For values.
  const forwarded =
    process.env.VERCEL === "1"
      ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
      : undefined;
  return forwarded && isIP(forwarded) ? forwarded : "shared-client";
}

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", "Cookie");
  return response;
}

export function authErrorResponse(error: unknown) {
  const requestId = randomUUID();
  if (error instanceof ZodError)
    return noStore(
      NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "Check the highlighted details.",
          details: error.issues.map((issue) => ({
            field: issue.path[0],
            message: issue.message,
          })),
          requestId,
        },
        { status: 422 },
      ),
    );
  if (error instanceof AppError) {
    const response = NextResponse.json(
      { code: error.code, message: error.message, requestId },
      { status: error.status },
    );
    if (error.retryAfter)
      response.headers.set("Retry-After", String(error.retryAfter));
    return noStore(response);
  }
  // Never serialize/log database errors, connection strings, request bodies, or credentials.
  return noStore(
    NextResponse.json(
      {
        code: "SERVICE_UNAVAILABLE",
        message:
          "Account access is temporarily unavailable. Please try again later.",
        requestId,
      },
      { status: 503 },
    ),
  );
}

export async function accountAccessResponse(
  request: NextRequest,
  action: "signup" | "login",
) {
  try {
    assertSameOrigin(request);
    const data = await readJson(request);
    const result = await (action === "signup"
      ? signup(data, clientIdentity(request))
      : login(data, clientIdentity(request)));
    const response = noStore(
      NextResponse.json(
        { data: { user: result.user } },
        { status: action === "signup" ? 201 : 200 },
      ),
    );
    response.cookies.set(sessionCookieName(), result.token, {
      ...sessionCookieOptions(),
      expires: result.expiresAt,
    });
    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function logoutResponse(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await logout(request.cookies.get(sessionCookieName())?.value);
    const response = noStore(new NextResponse(null, { status: 204 }));
    response.cookies.set(sessionCookieName(), "", {
      ...sessionCookieOptions(),
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function currentUserResponse(request: NextRequest) {
  try {
    const user = await getSessionUser(
      request.cookies.get(sessionCookieName())?.value,
    );
    if (!user)
      throw new AppError(401, "UNAUTHENTICATED", "Please log in to continue.");
    return noStore(NextResponse.json({ data: { user } }));
  } catch (error) {
    return authErrorResponse(error);
  }
}
