"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  FileText,
  Map,
  Lightbulb,
  UserCircle,
  Users,
  AlertTriangle,
  LineChart,
  Settings,
  Shield,
  ScrollText,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/constants";

interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface SidebarNavGroup {
  title: string;
  items: SidebarNavItem[];
}

function getNavGroups(role: Role): SidebarNavGroup[] {
  switch (role) {
    case "STUDENT":
      return [
        {
          title: "Overview",
          items: [
            {
              title: "Dashboard",
              href: "/student/dashboard",
              icon: <LayoutDashboard className="h-5 w-5" />,
            },
            {
              title: "Performance",
              href: "/student/performance",
              icon: <BarChart3 className="h-5 w-5" />,
            },
          ],
        },
        {
          title: "Preparation",
          items: [
            {
              title: "Assessments",
              href: "/student/assessments",
              icon: <ClipboardList className="h-5 w-5" />,
              badge: 3,
            },
            {
              title: "Mock Tests",
              href: "/student/mock-tests",
              icon: <FileText className="h-5 w-5" />,
            },
            {
              title: "Roadmap",
              href: "/student/roadmap",
              icon: <Map className="h-5 w-5" />,
            },
          ],
        },
        {
          title: "Growth",
          items: [
            {
              title: "Recommendations",
              href: "/student/recommendations",
              icon: <Lightbulb className="h-5 w-5" />,
            },
            {
              title: "Profile",
              href: "/student/profile",
              icon: <UserCircle className="h-5 w-5" />,
            },
          ],
        },
      ];
    case "FACULTY":
      return [
        {
          title: "Overview",
          items: [
            {
              title: "Dashboard",
              href: "/faculty/dashboard",
              icon: <LayoutDashboard className="h-5 w-5" />,
            },
            {
              title: "Students",
              href: "/faculty/students",
              icon: <Users className="h-5 w-5" />,
            },
          ],
        },
        {
          title: "Analysis",
          items: [
            {
              title: "Performance",
              href: "/faculty/performance",
              icon: <BarChart3 className="h-5 w-5" />,
            },
            {
              title: "Assessments",
              href: "/faculty/assessments",
              icon: <ClipboardList className="h-5 w-5" />,
            },
            {
              title: "Analytics",
              href: "/faculty/analytics",
              icon: <LineChart className="h-5 w-5" />,
            },
          ],
        },
        {
          title: "Intervention",
          items: [
            {
              title: "Needs Attention",
              href: "/faculty/attention",
              icon: <AlertTriangle className="h-5 w-5" />,
              badge: 5,
            },
          ],
        },
      ];
    case "MANAGEMENT":
      return [
        {
          title: "Overview",
          items: [
            {
              title: "Dashboard",
              href: "/management/dashboard",
              icon: <LayoutDashboard className="h-5 w-5" />,
            },
          ],
        },
        {
          title: "People",
          items: [
            {
              title: "Students",
              href: "/management/students",
              icon: <GraduationCap className="h-5 w-5" />,
            },
            {
              title: "Faculty",
              href: "/management/faculty",
              icon: <Users className="h-5 w-5" />,
            },
          ],
        },
        {
          title: "Academics",
          items: [
            {
              title: "Assessments",
              href: "/management/assessments",
              icon: <ClipboardList className="h-5 w-5" />,
            },
            {
              title: "Mock Tests",
              href: "/management/mock-tests",
              icon: <FileText className="h-5 w-5" />,
            },
            {
              title: "Roadmaps",
              href: "/management/roadmaps",
              icon: <Map className="h-5 w-5" />,
            },
          ],
        },
        {
          title: "Reporting",
          items: [
            {
              title: "Reports",
              href: "/management/reports",
              icon: <BookOpen className="h-5 w-5" />,
            },
          ],
        },
        {
          title: "Administration",
          items: [
            {
              title: "Permissions",
              href: "/management/permissions",
              icon: <Shield className="h-5 w-5" />,
            },
            {
              title: "Audit Logs",
              href: "/management/audit-logs",
              icon: <ScrollText className="h-5 w-5" />,
            },
            {
              title: "Settings",
              href: "/management/settings",
              icon: <Settings className="h-5 w-5" />,
            },
          ],
        },
      ];
  }
}

interface SidebarProps {
  role: Role;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userName: string;
  userEmail: string;
}

export function Sidebar({
  role,
  collapsed,
  onToggleCollapse,
  userName,
  userEmail,
}: SidebarProps) {
  const pathname = usePathname();
  const navGroups = getNavGroups(role);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm shrink-0">
            PP
          </div>
          {!collapsed && (
            <span className="font-semibold text-slate-900 truncate text-sm">
              PlacePrep Portal
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-6">
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <span
                        className={cn(
                          "shrink-0",
                          isActive ? "text-blue-600" : "text-slate-400"
                        )}
                      >
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-200 p-3 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold shrink-0">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {userName}
              </p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-full h-9 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}

/* ─── Mobile Sidebar ─── */
interface MobileSidebarProps {
  role: Role;
  open: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
}

export function MobileSidebar({
  role,
  open,
  onClose,
  userName,
  userEmail,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const navGroups = getNavGroups(role);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-xl">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm">
              PP
            </div>
            <span className="font-semibold text-slate-900 text-sm">
              PlacePrep Portal
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-50"
            aria-label="Close menu"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-6">
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <span
                          className={cn(
                            "shrink-0",
                            isActive ? "text-blue-600" : "text-slate-400"
                          )}
                        >
                          {item.icon}
                        </span>
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {userName}
              </p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 mt-3 px-3 py-2 w-full rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
