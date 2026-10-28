import type { NextRequest } from "next/server";
import { accountAccessResponse } from "@/modules/auth/auth.http";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return accountAccessResponse(request, "login");
}
