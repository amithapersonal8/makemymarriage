import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/http/app-error";
import {
  assertSameOrigin,
  authErrorResponse,
  readJson,
  sessionCookieName,
} from "@/modules/auth/auth.http";
import { getSessionUser } from "@/modules/auth/auth.service";
import {
  createWedding,
  editWedding,
  getWedding,
  listWeddings,
} from "./wedding.service";

export async function weddingResponse(request: NextRequest, id?: string) {
  try {
    if (request.method !== "GET") assertSameOrigin(request);
    const user = await getSessionUser(
      request.cookies.get(sessionCookieName())?.value,
    );
    if (!user)
      throw new AppError(401, "UNAUTHENTICATED", "Please log in to continue.");
    const expectedUser = request.headers.get("x-expected-user-id");
    if (expectedUser && expectedUser !== user.id)
      throw new AppError(
        401,
        "SESSION_CHANGED",
        "Please sign in with the original account to continue.",
      );
    const data =
      request.method === "GET"
        ? id
          ? await getWedding(user, id)
          : await listWeddings(user)
        : request.method === "POST"
          ? await createWedding(user, await readJson(request))
          : await editWedding(user, id ?? "", await readJson(request));
    return NextResponse.json(
      { data },
      {
        status: request.method === "POST" ? 201 : 200,
        headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
      },
    );
  } catch (error) {
    if (error instanceof AppError || error instanceof ZodError)
      return authErrorResponse(error);
    return authErrorResponse(
      new AppError(
        503,
        "SERVICE_UNAVAILABLE",
        "We couldn’t save or load your wedding. Please try again.",
      ),
    );
  }
}
