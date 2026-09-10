"use client";

import { AppShell } from "@/components/layout";

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
