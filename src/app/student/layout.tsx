import { guardPortalRoute } from "@/lib/auth/portal-guard";
import { AppShell } from "@/components/layout";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardPortalRoute("STUDENT");
  return <AppShell>{children}</AppShell>;
}
