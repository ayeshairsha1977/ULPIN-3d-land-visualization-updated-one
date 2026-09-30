import React from "react";
import { User, Bell } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import Panel from "@/components/common/Panel";
import InfoGrid from "@/components/common/InfoGrid";
import { useRole, ROLE_TITLES } from "@/hooks/useRole";
import { useEntityList } from "@/hooks/useData";
import { fmtDateTime, fmtDate } from "@/lib/ids";

export default function Profile() {
  const { user, role } = useRole();
  const { data = [] } = useEntityList("Notification", { user_id: user?.id }, { enabled: !!user?.id });
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader eyebrow="Account" title="Profile" />
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <Panel title="Account details" icon={User}>
          <InfoGrid items={[
            { label: "Full Name", value: user?.full_name || "—" },
            { label: "Email", value: user?.email },
            { label: "Role", value: ROLE_TITLES[role] },
            { label: "Member since", value: fmtDate(user?.created_date) },
          ]} />
        </Panel>
        <Panel><p className="text-sm text-muted-foreground">Your role is set by the server. Surveyor and Government accounts are created by an administrator; citizens cannot change their own role.</p></Panel>
      </div>
      <Panel title="Notifications" icon={Bell} className="mt-6">
        {data.length === 0 ? <p className="text-sm text-muted-foreground">No notifications yet.</p> : (
          <ul className="divide-y divide-line">
            {data.map((n) => (
              <li key={n.id} className="py-3">
                <p className="text-sm font-medium text-ink">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{fmtDateTime(n.created_date)}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}