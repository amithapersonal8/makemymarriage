import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WeddingDraftProvider } from "@/components/weddings/wedding-draft-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Make My Marriage",
  description: "One wedding, multiple events, one shared planning space.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WeddingDraftProvider>{children}</WeddingDraftProvider>
      </body>
    </html>
  );
}
