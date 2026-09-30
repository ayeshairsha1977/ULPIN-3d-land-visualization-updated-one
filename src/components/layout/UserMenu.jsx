import React from "react";
import { Link } from "react-router-dom";
import { LogOut, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocalSession } from "@/lib/LocalSessionContext";
import { useRole } from "@/hooks/useRole";
import { CITIZEN_LINKS, GOV_LINKS, SURVEYOR_LINKS } from "@/components/layout/navLinks";
import DemoRoleSwitch from "@/components/layout/DemoRoleSwitch";

export default function UserMenu() {
  const { logout } = useLocalSession();
  const { user, role, label } = useRole();
  const links = role === "government" ? GOV_LINKS : role === "surveyor" ? SURVEYOR_LINKS : CITIZEN_LINKS;
  const initials = (user?.full_name || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-md hover:bg-white/10 text-white" aria-label="Account menu">
          <span className="w-7 h-7 rounded-full bg-brand-light/90 text-navy text-xs font-bold flex items-center justify-center">{initials}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0 z-[1200]">
        <div className="px-4 py-3 border-b border-line">
          <p className="text-sm font-semibold text-ink truncate">{user?.full_name || "Account"}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email} · {label}</p>
        </div>
        <nav className="p-1.5">
          {links.map((l) => <Link key={l.to + l.label} to={l.to} className="block px-3 py-2 rounded-md text-sm hover:bg-muted">{l.label}</Link>)}
          {role !== "citizen" && <Link to="/profile" className="block px-3 py-2 rounded-md text-sm hover:bg-muted">Profile</Link>}
        </nav>
        <div className="p-3 border-t border-line"><DemoRoleSwitch /></div>
        <button onClick={() => logout()} className="w-full flex items-center gap-2 px-4 py-3 border-t border-line text-sm text-red-700 hover:bg-red-50">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </PopoverContent>
    </Popover>
  );
}