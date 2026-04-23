import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/auth/auth-context";
import { AuthShell } from "./auth-shell";

/**
 * Client-side route guard. While the Supabase session is still resolving
 * we render a quiet shell (matches splash). If no session, we replace
 * to /login. Otherwise children render.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, state } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (state === "guest") {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, state, navigate]);

  if (loading || state === "guest") {
    return <AuthShell><div /></AuthShell>;
  }
  return <>{children}</>;
}