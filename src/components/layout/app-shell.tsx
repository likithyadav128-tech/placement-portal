"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Sidebar, MobileSidebar } from "./sidebar";
import { Header } from "./header";
import { useRole } from "@/context/RoleContext";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { currentRole, user, isLoading, error, signOut } = useRole();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Defense-in-depth: client-side route guard against cross-portal navigation
  useEffect(() => {
    if (!user || isLoading) return;
    const pathname = window.location.pathname;
    if (pathname.startsWith("/student") && user.role !== "STUDENT") {
      router.replace(user.role === "FACULTY" ? "/faculty/dashboard" : "/management/dashboard");
    } else if (pathname.startsWith("/faculty") && user.role !== "FACULTY") {
      router.replace(user.role === "STUDENT" ? "/student/dashboard" : "/management/dashboard");
    } else if (pathname.startsWith("/management") && user.role !== "MANAGEMENT") {
      router.replace(user.role === "STUDENT" ? "/student/dashboard" : "/faculty/dashboard");
    }
  }, [user, isLoading, router]);

  // 1. Loading state prevents flashing mock identities or premature renders
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // 2. Account status / provisioning error state (404 not in DB or 403 inactive/blocked)
  if (error) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Account Provisioning Notice
          </h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <button
            onClick={signOut}
            className="w-full h-10 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Sign in with another account
          </button>
        </div>
      </div>
    );
  }

  // 3. Fallback if unauthenticated and waiting for redirect
  if (!user) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
          <p className="text-sm text-slate-600 mb-4">
            Please sign in to access this portal.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

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
