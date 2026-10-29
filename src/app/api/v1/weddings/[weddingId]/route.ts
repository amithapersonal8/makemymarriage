import { NextRequest } from "next/server";
import { weddingResponse } from "@/modules/weddings/wedding.http";
export const runtime = "nodejs";
type Context = { params: Promise<{ weddingId: string }> };
export async function GET(request: NextRequest, context: Context) {
  return weddingResponse(request, (await context.params).weddingId);
}
export async function PATCH(request: NextRequest, context: Context) {
  return weddingResponse(request, (await context.params).weddingId);
}
