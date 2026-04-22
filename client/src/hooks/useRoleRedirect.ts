import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./useAuth";

export function useRoleRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    const role = (user as any).role;
    const path = window.location.pathname;

    // Only redirect from ambiguous entry points
    if (path === "/dashboard" || path === "/app" || path === "/") return;

    if (path === "/login" || path === "/signup") {
      if (role === "athlete") navigate("/athlete-dashboard");
      else if (role === "coach" || role === "assistant_coach") navigate("/app");
      else navigate("/app");
    }
  }, [user, isAuthenticated, isLoading]);
}
