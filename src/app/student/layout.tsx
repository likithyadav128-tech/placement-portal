import { guardPortalRoute } from "@/lib/auth/portal-guard";
import { AppShell } from "@/components/layout";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardPortalRoute("STUDENT");
  return <AppShell>{children}</AppShell>;
}
