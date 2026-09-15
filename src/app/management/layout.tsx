import { guardPortalRoute } from "@/lib/auth/portal-guard";
import { AppShell } from "@/components/layout";

export default async function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardPortalRoute("MANAGEMENT");
  return <AppShell>{children}</AppShell>;
}
