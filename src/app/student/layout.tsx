"use client";

import { AppShell } from "@/components/layout";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
