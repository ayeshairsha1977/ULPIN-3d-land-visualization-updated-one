import React from "react";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useLocalSession } from "@/lib/LocalSessionContext";
import { useRole } from "@/hooks/useRole";
import { PUBLIC_LINKS, CITIZEN_LINKS, GOV_LINKS, SURVEYOR_LINKS } from "@/components/layout/navLinks";
import DemoRoleSwitch from "@/components/layout/DemoRoleSwitch";

const cls = ({ isActive }) => `block px-3 py-2.5 rounded-md text-sm ${isActive ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"}`;

function Group({ title, links, onNavigate }) {
  return (
    <div>
      <p className="px-3 mb-1 text-[11px] uppercase tracking-widest text-slate-500">{title}</p>
      {links.map((l) => <NavLink key={l.to + l.label} to={l.to} end onClick={onNavigate} className={cls}>{l.label}</NavLink>)}
    </div>
  );
}

export default function MobileNav({ onNavigate }) {
  const { logout } = useLocalSession();
  const { role } = useRole();
  const roleLinks = role === "government" ? GOV_LINKS : role === "surveyor" ? SURVEYOR_LINKS : CITIZEN_LINKS;
  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <p className="font-heading font-extrabold px-3 pt-2">ULPIN 3D</p>
      <Group title="Explore" links={PUBLIC_LINKS} onNavigate={onNavigate} />
      <Group title={role === "citizen" ? "My Account" : "Government"} links={roleLinks} onNavigate={onNavigate} />
      <div className="px-3"><DemoRoleSwitch dark /></div>
      <button onClick={() => logout()} className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:text-white">
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </div>
  );
}