"use client";

import { RoleProvider } from "@/context/RoleContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <RoleProvider>{children}</RoleProvider>;
}
