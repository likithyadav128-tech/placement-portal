"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { Role } from "@/lib/constants";
import type { User, Notification } from "@/types";

interface RoleContextValue {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  user: User;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
}

const defaultStudentUser: User = {
  id: "STU001",
  name: "Arjun Patel",
  email: "arjun.patel@university.edu",
  role: "STUDENT",
  department: "Computer Science",
};

const defaultFacultyUser: User = {
  id: "FAC001",
  name: "Dr. Rajesh Kumar",
  email: "rajesh.kumar@university.edu",
  role: "FACULTY",
  department: "Computer Science",
};

const defaultManagementUser: User = {
  id: "MGT001",
  name: "Prof. Sunita Reddy",
  email: "sunita.reddy@university.edu",
  role: "MANAGEMENT",
  department: "Administration",
};

const defaultNotifications: Notification[] = [
  {
    id: "1",
    title: "New Assessment Available",
    message: "Data Structures Coding Challenge is now available",
    type: "info",
    read: false,
    createdAt: "2026-09-09T10:00:00Z",
  },
  {
    id: "2",
    title: "Performance Update",
    message: "Your coding score improved by 8% this month",
    type: "success",
    read: false,
    createdAt: "2026-09-08T14:00:00Z",
  },
  {
    id: "3",
    title: "Upcoming Deadline",
    message: "Aptitude Assessment due in 2 days",
    type: "warning",
    read: true,
    createdAt: "2026-09-07T09:00:00Z",
  },
  {
    id: "4",
    title: "Mock Test Results",
    message: "TCS NQT Mock Test results are ready",
    type: "info",
    read: true,
    createdAt: "2026-09-06T16:00:00Z",
  },
];

function getUserForRole(role: Role): User {
  switch (role) {
    case "STUDENT":
      return defaultStudentUser;
    case "FACULTY":
      return defaultFacultyUser;
    case "MANAGEMENT":
      return defaultManagementUser;
  }
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>("STUDENT");
  const [notifications, setNotifications] =
    useState<Notification[]>(defaultNotifications);

  const user = getUserForRole(currentRole);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        user,
        notifications,
        unreadCount,
        markAsRead,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
