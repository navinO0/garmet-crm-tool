"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Scissors,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid credentials. Please try again.");
        setIsLoading(false);
        return;
      }

      // Successful login -> Navigate to target page or dashboard
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError("Network or server connection failed. Please retry.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 mb-2 shadow-xs">
          <Scissors className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-serif">
          Raadhe Label
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Garment Production &amp; Order Management System
        </p>
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-[11px] text-zinc-600 dark:text-zinc-400">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>Authorized Personnel Only. Secure Session Protected.</span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label
            htmlFor="username"
            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Username or Email
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              required
              placeholder="e.g. admin@radhevastraz.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-9 h-10 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-9 h-10 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !username || !password}
          className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs gap-2 rounded-lg shadow-md transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In to Production Portal</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Footer Info */}
      <div className="pt-2 text-center border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-[11px] text-zinc-400">
          Radhe Vastraz Enterprise Production Suite • Confidential
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-950 transition-colors">
      <Suspense fallback={<div className="text-xs text-zinc-400">Loading portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

