import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Box, LogIn, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useRole } from "@/hooks/useRole";
import { PUBLIC_LINKS } from "@/components/layout/navLinks";
import NotificationPanel from "@/components/layout/NotificationPanel";
import UserMenu from "@/components/layout/UserMenu";
import MobileNav from "@/components/layout/MobileNav";

const linkCls = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition ${isActive ? "text-white bg-white/10" : "text-slate-300 hover:text-white"}`;

export default function Navbar() {
  const { role } = useRole();
  const [open, setOpen] = useState(false);
  const dash = !role ? null : role === "citizen" ? { to: "/dashboard", label: "Dashboard" } : { to: role === "government" ? "/admin" : "/admin/properties", label: role === "government" ? "Government" : "Verification" };

  return (
    <header className="no-print sticky top-0 z-[1100] bg-navy border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="ULPIN 3D home">
          <span className="w-8 h-8 rounded-md bg-brand flex items-center justify-center"><Box className="w-4 h-4 text-white" /></span>
          <span className="font-heading font-extrabold text-white tracking-tight">ULPIN 3D</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
          {PUBLIC_LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkCls}>{l.label}</NavLink>)}
          {dash && <span className="w-px h-5 bg-white/15 mx-2" />}
          {dash && <NavLink to={dash.to} end className={linkCls}>{dash.label}</NavLink>}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          {role && <NotificationPanel />}
          <div className="hidden lg:block">
            {role ? <UserMenu /> : (
              <Link to="/login" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold text-navy bg-brand-light hover:bg-white">
                <LogIn className="w-4 h-4" aria-hidden="true" />Sign in
              </Link>
            )}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden p-2 text-white rounded-md hover:bg-white/10" aria-label="Open menu"><Menu className="w-5 h-5" /></button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-navy text-white border-white/10 p-0 z-[1200]">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <MobileNav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}