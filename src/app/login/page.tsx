"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err === "unregistered") {
        return "Your Microsoft account is authenticated, but you are not registered for this portal. Please contact your institution administrator.";
      } else if (err === "blocked") {
        return "Your account has been suspended or blocked. Please contact your institution administrator.";
      } else if (err === "inactive") {
        return "Your account is currently inactive. Please contact your institution administrator.";
      } else if (err === "oauth_failed") {
        return "Microsoft authentication failed. Please try again.";
      }
    }
    return null;
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setAuthError(null);

    try {
      const supabase = createClient();
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes("invalid login credentials")) {
          setAuthError("Invalid email or password. Please check your credentials and try again.");
        } else if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setAuthError("Your email address has not been confirmed. Please check your inbox for the verification link.");
        } else {
          setAuthError(signInError.message || "Authentication failed. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setAuthError("Authentication failed. No user session returned.");
        setIsLoading(false);
        return;
      }

      // Query server-side application identity and role with Bearer token and automatic transient retry
      const token = authData.session?.access_token;
      const authHeaders: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      let meResponse = await fetch("/api/auth/me", {
        headers: authHeaders,
      });

      // If server returns a transient error (e.g. 500 during pooler reconnect), retry once after a short delay
      if (meResponse.status === 500) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        meResponse = await fetch("/api/auth/me", {
          headers: authHeaders,
        });
      }

      const meData = (await meResponse.json().catch(() => ({}))) as {
        user?: {
          id: string;
          name: string;
          email: string;
          role: string;
          department?: string | null;
        };
        error?: string;
      };

      if (!meResponse.ok) {
        if (meResponse.status === 401) {
          await supabase.auth.signOut();
          setAuthError("Session could not be verified. Please try signing in again.");
        } else if (meResponse.status === 404) {
          await supabase.auth.signOut();
          setAuthError(
            meData.error ||
              "Your account is authenticated, but no matching user profile was found in the portal database. Please contact your institution administrator."
          );
        } else if (meResponse.status === 403) {
          await supabase.auth.signOut();
          setAuthError(
            meData.error ||
              "Your account has been suspended, blocked, or is inactive. Please contact your institution administrator."
          );
        } else {
          // Do NOT destroy authenticated session on transient server/database errors
          setAuthError(
            "Unable to connect to the database to resolve your account profile. Please check your connection and try again."
          );
        }
        setIsLoading(false);
        return;
      }

      const role = meData.user?.role;

      // Role-based routing strictly derived from database response
      if (role === "STUDENT") {
        router.push("/student/dashboard");
      } else if (role === "FACULTY") {
        router.push("/faculty/dashboard");
      } else if (role === "MANAGEMENT") {
        router.push("/management/dashboard");
      } else {
        await supabase.auth.signOut();
        setAuthError("Unrecognized account role. Please contact your institution administrator.");
        setIsLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "A network error occurred. Please try again.";
      setAuthError(message);
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          scopes: "openid profile email User.Read",
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        console.warn("Supabase Microsoft OAuth error:", error.message);
        setAuthError(error.message || "Microsoft authentication failed. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.warn("Supabase client error:", err);
      setAuthError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during Microsoft login."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full border border-white" />
          <div className="absolute bottom-40 right-10 w-96 h-96 rounded-full border border-white" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full border border-white" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-lg">
              PP
            </div>
            <span className="text-white font-semibold text-lg">
              PlacePrep Portal
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Your journey to placement readiness starts here.
          </h1>
          <p className="mt-4 text-lg text-slate-400 leading-relaxed">
            Track your performance, take assessments, follow personalized
            roadmaps, and prepare for your dream placement.
          </p>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-bold text-white">1,500+</p>
              <p className="text-sm text-slate-400 mt-1">Active Students</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">85%</p>
              <p className="text-sm text-slate-400 mt-1">Placement Rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">200+</p>
              <p className="text-sm text-slate-400 mt-1">Companies</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-slate-500">
            © 2026 PlacePrep Portal. University Placement Cell.
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-lg">
              PP
            </div>
            <span className="font-semibold text-lg text-slate-900">
              PlacePrep Portal
            </span>
          </div>

          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to your account to continue
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <Shield className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{authError}</div>
            </div>
          )}

          {/* Microsoft Login */}
          <button
            onClick={handleMicrosoftLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 w-full h-11 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            Continue with Microsoft
          </button>

          {/* Google Login */}
          <button
            onClick={handleMicrosoftLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 w-full h-11 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 mt-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 pl-10 pr-11 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Trust Badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="h-3.5 w-3.5" />
            <span>Secured with enterprise-grade authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
