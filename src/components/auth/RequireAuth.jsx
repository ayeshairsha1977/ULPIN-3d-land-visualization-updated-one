import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/SessionContext";

// Hides signed-in pages from guests. The API still checks every request on its own.
export default function RequireAuth() {
  const { user, isLoading } = useSession();
  const location = useLocation();
  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-label="Loading" /></div>;
  }
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <Outlet />;
}
