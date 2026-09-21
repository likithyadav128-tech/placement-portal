"use client";

import React, { useState } from "react";
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
import { fetchAuthMe } from "@/lib/auth/client-me";
import { useRole } from "@/context/RoleContext";

export default function LoginPage() {
  const { refreshUser } = useRole();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err === "unregistered") {
        return "Your account is authenticated, but you are not registered for this portal. Please contact your institution administrator.";
      } else if (err === "blocked") {
        return "Your account has been suspended or blocked. Please contact your institution administrator.";
      } else if (err === "inactive") {
        return "Your account is currently inactive. Please contact your institution administrator.";
      } else if (err === "oauth_failed") {
        return "Authentication failed. Please try again.";
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

      // Explicitly obtain session and access token
      const session = authData.session ?? (await supabase.auth.getSession()).data?.session;
      const accessToken = session?.access_token;
      if (!accessToken) {
        setAuthError("Session could not be verified. Please try signing in again.");
        setIsLoading(false);
        return;
      }

      // Query server-side application identity and role with Bearer token using shared helper
      const meResult = await fetchAuthMe(accessToken);

      if (!meResult.ok || !meResult.user) {
        if (meResult.status === 401) {
          await supabase.auth.signOut();
          setAuthError("Session could not be verified. Please try signing in again.");
        } else if (meResult.status === 404) {
          await supabase.auth.signOut();
          setAuthError(
            meResult.error ||
              "Your account is authenticated, but no matching user profile was found in the portal database. Please contact your institution administrator."
          );
        } else if (meResult.status === 403) {
          await supabase.auth.signOut();
          setAuthError(
            meResult.error ||
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

      // Ensure RoleContext has the authenticated user state before navigating
      await refreshUser(accessToken);

      const role = meResult.user.role;

      // Full document navigation bypasses App Router prefetch cache and ensures all cookies are committed
      const targetUrl =
        role === "STUDENT"
          ? "/student/dashboard"
          : role === "FACULTY"
          ? "/faculty/dashboard"
          : role === "MANAGEMENT"
          ? "/management/dashboard"
          : null;

      if (targetUrl) {
        window.location.href = targetUrl;
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
              Sign in to your account with your university credentials
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <Shield className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{authError}</div>
            </div>
          )}

          {/* Email/Password Form (Strictly Email/Password authentication only) */}
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
