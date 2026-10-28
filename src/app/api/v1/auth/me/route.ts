import type { NextRequest } from "next/server";
import { currentUserResponse } from "@/modules/auth/auth.http";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  return currentUserResponse(request);
}
