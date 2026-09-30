import React from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { localClient } from "@/api/localClient";
import { useRole } from "@/hooks/useRole";
import { useEntityList, useInvalidate } from "@/hooks/useData";
import { fmtDateTime } from "@/lib/ids";

export default function NotificationPanel() {
  const { user } = useRole();
  const { data = [] } = useEntityList("Notification", { user_id: user?.id }, { enabled: !!user?.id });
  const invalidate = useInvalidate();
  const unread = data.filter((n) => !n.read);

  const markAll = async () => {
    await Promise.all(unread.map((n) => localClient.entities.Notification.update(n.id, { read: true })));
    invalidate("Notification");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-md text-slate-200 hover:bg-white/10" aria-label={`Notifications (${unread.length} unread)`}>
          <Bell className="w-5 h-5" />
          {unread.length > 0 && <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-brand-accent text-[10px] font-bold text-navy flex items-center justify-center">{unread.length}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 z-[1200]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          {unread.length > 0 && <button onClick={markAll} className="text-xs text-primary hover:underline">Mark all read</button>}
        </div>
        <ul className="max-h-80 overflow-y-auto divide-y divide-line">
          {data.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet. Updates on your applications and complaints will appear here.</li>}
          {data.slice(0, 20).map((n) => (
            <li key={n.id}>
              <Link to={n.link || "/dashboard"} className={`block px-4 py-3 hover:bg-muted ${n.read ? "" : "bg-accent/40"}`}>
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{fmtDateTime(n.created_date)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}