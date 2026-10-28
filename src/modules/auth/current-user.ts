import "server-only";

import { cookies } from "next/headers";

import { sessionCookieName } from "@/modules/auth/auth.http";
import { getSessionUser } from "@/modules/auth/auth.service";

export async function currentUser() {
  const cookieStore = await cookies();
  return getSessionUser(cookieStore.get(sessionCookieName())?.value);
}
