import { NextRequest } from "next/server";
import { weddingResponse } from "@/modules/weddings/wedding.http";
export const runtime = "nodejs";
export const GET = (request: NextRequest) => weddingResponse(request);
export const POST = (request: NextRequest) => weddingResponse(request);
