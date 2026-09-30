import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import DemoBanner from "@/components/layout/DemoBanner";
import Footer from "@/components/layout/Footer";

export default function AppLayout() {
  const { pathname } = useLocation();
  const fullBleed = pathname === "/map" || pathname.endsWith("/3d");

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