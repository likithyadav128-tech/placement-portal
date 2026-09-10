"use client";

import { AppShell } from "@/components/layout";

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
