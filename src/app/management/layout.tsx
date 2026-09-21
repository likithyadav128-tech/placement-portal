import { guardPortalRoute } from "@/lib/auth/portal-guard";
import { AppShell } from "@/components/layout";

export const dynamic = "force-dynamic";

export default async function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardPortalRoute("MANAGEMENT");
  return <AppShell>{children}</AppShell>;
}
