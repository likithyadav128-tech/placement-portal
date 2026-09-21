import { guardPortalRoute } from "@/lib/auth/portal-guard";
import { AppShell } from "@/components/layout";

export const dynamic = "force-dynamic";

export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardPortalRoute("FACULTY");
  return <AppShell>{children}</AppShell>;
}
