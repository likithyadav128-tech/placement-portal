"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/constants";
import type { User, Notification } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { fetchAuthMe } from "@/lib/auth/client-me";

interface RoleContextValue {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  refreshUser: (token?: string | null) => Promise<void>;
  signOut: () => Promise<void>;
}

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

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRoleState] = useState<Role>(() => {
    // Derive initial role from pathname if available to prevent flash/hydration issues
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/faculty")) return "FACULTY";
      if (path.startsWith("/management")) return "MANAGEMENT";
      if (path.startsWith("/student")) return "STUDENT";
    }
    return "STUDENT";
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] =
    useState<Notification[]>(defaultNotifications);

  const inFlightPromiseRef = useRef<Promise<void> | null>(null);

  const fetchUser = useCallback(
    async (explicitToken?: string | null) => {
      // If a fetch is already in flight and no explicit token is provided, await it
      if (inFlightPromiseRef.current && !explicitToken) {
        return inFlightPromiseRef.current;
      }

      const run = async () => {
        try {
          const result = await fetchAuthMe(explicitToken);

          if (!result.ok || !result.user) {
            if (result.status === 401) {
              // Unauthenticated session
              setUser(null);
              setError(null);
              // Redirect to login if on protected route
              const currentPath =
                typeof window !== "undefined" ? window.location.pathname : "";
              const isProtectedRoute =
                currentPath &&
                (currentPath.startsWith("/student") ||
                  currentPath.startsWith("/faculty") ||
                  currentPath.startsWith("/management"));
              if (isProtectedRoute) {
                router.push("/login");
              }
            } else if (result.status === 404) {
              setUser(null);
              setError(
                result.error ||
                  "Your account authenticated successfully, but no matching profile was found in the application database."
              );
            } else if (result.status === 403) {
              setUser(null);
              setError(
                result.error ||
                  "Your account has been suspended, blocked, or is currently inactive."
              );
            } else {
              // Transient error: do not destroy an already-loaded user session
              setUser((currentUser) => {
                if (!currentUser) {
                  setError(result.error || "Failed to load user profile.");
                }
                return currentUser;
              });
            }
            return;
          }

          setUser(result.user);
          setCurrentRoleState(result.user.role);
          setError(null);
        } catch (err: unknown) {
          setUser((currentUser) => {
            if (!currentUser) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Network error occurred while resolving user session."
              );
            }
            return currentUser;
          });
        } finally {
          setIsLoading(false);
          inFlightPromiseRef.current = null;
        }
      };

      inFlightPromiseRef.current = run();
      return inFlightPromiseRef.current;
    },
    [router]
  );

  useEffect(() => {
    fetchUser();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setError(null);
        setIsLoading(false);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.access_token) {
          fetchUser(session.access_token);
        } else {
          fetchUser();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  // Client-side role override is disabled for authenticated users.
  // The authenticated role is strictly authoritative from the database.
  const setCurrentRole = useCallback(
    (role: Role) => {
      if (user) {
        console.warn(
          "Role modification rejected: authenticated role is authoritative and cannot be overridden by client."
        );
        return;
      }
      setCurrentRoleState(role);
    },
    [user]
  );

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setUser(null);
      setError(null);
      router.push("/login");
    }
  }, [router]);

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
        isLoading,
        error,
        notifications,
        unreadCount,
        markAsRead,
        refreshUser: fetchUser,
        signOut,
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
