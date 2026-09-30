import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import DemoBanner from "@/components/layout/DemoBanner";
import Footer from "@/components/layout/Footer";
import { useRole } from "@/hooks/useRole";

export default function AppLayout() {
  const { role, setRole } = useRole();
  const { pathname } = useLocation();
  const fullBleed = pathname === "/map" || pathname.endsWith("/3d");

  // Apply the demo role picked on the login screen.
  useEffect(() => {
    const pending = localStorage.getItem("ulpin_demo_role");
    if (!pending) return;
    localStorage.removeItem("ulpin_demo_role");
    if (pending !== role) setRole(pending, pending === "government" ? "/admin" : "/dashboard");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <DemoBanner />
      <main className="flex-1">
        <Outlet />
      </main>
      {!fullBleed && <Footer />}
    </div>
  );
}