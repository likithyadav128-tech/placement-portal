import { guardPortalRoute } from "@/lib/auth/portal-guard";
import { AppShell } from "@/components/layout";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardPortalRoute("FACULTY");
  return <AppShell>{children}</AppShell>;
}
