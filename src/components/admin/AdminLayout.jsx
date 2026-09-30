import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Lock } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { GOV_LINKS, SURVEYOR_LINKS } from "@/components/layout/navLinks";
import DemoRoleSwitch from "@/components/layout/DemoRoleSwitch";

const cls = ({ isActive }) => `shrink-0 px-3 py-2 rounded-md text-sm font-medium transition ${isActive ? "bg-primary text-white" : "text-muted-foreground hover:text-ink hover:bg-muted"}`;

export default function AdminLayout({ allow = ["government"] }) {
  const { role } = useRole();
  if (!allow.includes(role)) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4"><Lock className="w-5 h-5 text-primary" /></div>
        <h1 className="text-xl font-bold text-ink">Government access only</h1>
        <p className="text-sm text-muted-foreground mt-2 mb-6">This area is available to the {allow.includes("surveyor") ? "Surveyor or Government" : "Government"} Demo account. Switch role to continue.</p>
        <div className="text-left bg-card border border-line rounded-xl p-4"><DemoRoleSwitch /></div>
      </div>
    );
  }
  const links = role === "government" ? GOV_LINKS : SURVEYOR_LINKS;
  return (
    <div>
      <div className="no-print bg-card border-b border-line">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex gap-1 overflow-x-auto" aria-label="Government">
          {links.map((l) => <NavLink key={l.label} to={l.to} end className={cls}>{l.label}</NavLink>)}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}