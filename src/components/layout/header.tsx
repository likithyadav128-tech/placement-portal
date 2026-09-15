"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Menu,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Shield,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useRole } from "@/context/RoleContext";
import type { Role } from "@/lib/constants";

interface HeaderProps {
  onMenuClick: () => void;
  pageTitle?: string;
}

const roleLabels: Record<Role, string> = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  MANAGEMENT: "Management",
};

const roleBadgeColors: Record<Role, string> = {
  STUDENT: "bg-blue-50 text-blue-700 border-blue-200",
  FACULTY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MANAGEMENT: "bg-violet-50 text-violet-700 border-violet-200",
};

export function Header({ onMenuClick, pageTitle }: HeaderProps) {
  const { currentRole, user, notifications, unreadCount, markAsRead, signOut } = useRole();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {pageTitle && (
          <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
            {pageTitle}
          </h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Authoritative Role Indicator */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border",
            roleBadgeColors[currentRole]
          )}
        >
          <Shield className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{roleLabels[currentRole]}</span>
        </div>

        {/* Search (desktop) */}
        <button
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-400 hover:border-slate-300 transition-colors min-w-[200px]"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="ml-auto text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-blue-600 font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={cn(
                        "flex gap-3 w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0",
                        !notif.read && "bg-blue-50/50"
                      )}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          !notif.read ? "bg-blue-600" : "bg-transparent"
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold">
              {user?.name ? getInitials(user.name) : "U"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-900 leading-tight">
                {user?.name || "Loading..."}
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                {roleLabels[currentRole]}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
          </button>
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">
                    {user?.name || "Authenticated User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
                </div>
                <Link
                  href={
                    currentRole === "STUDENT"
                      ? "/student/profile"
                      : "#"
                  }
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href={
                    currentRole === "MANAGEMENT"
                      ? "/management/settings"
                      : "#"
                  }
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOut();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
