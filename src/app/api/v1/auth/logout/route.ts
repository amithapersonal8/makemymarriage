import type { NextRequest } from "next/server";
import { logoutResponse } from "@/modules/auth/auth.http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return logoutResponse(request);
}
