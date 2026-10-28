import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import "./auth.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
