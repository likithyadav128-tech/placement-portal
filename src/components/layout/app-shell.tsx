"use client";

import React, { useState } from "react";
import { Sidebar, MobileSidebar } from "./sidebar";
import { Header } from "./header";
import { useRole } from "@/context/RoleContext";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { currentRole, user } = useRole();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <Sidebar
        role={currentRole}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userName={user.name}
        userEmail={user.email}
      />

      {/* Mobile Sidebar */}
      <MobileSidebar
        role={currentRole}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        userName={user.name}
        userEmail={user.email}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
