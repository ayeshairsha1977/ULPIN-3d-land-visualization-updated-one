import React from "react";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import PropertyPhoto from "@/components/common/PropertyPhoto";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntityList, useStatuses } from "@/hooks/useData";
import { useRole } from "@/hooks/useRole";
import { getProperty } from "@/data/properties";

export default function MyProperties() {
  const { user } = useRole();
  const { data = [], isLoading } = useEntityList("ULPINApplication", { created_by_id: user?.id }, { enabled: !!user?.id });
  const statuses = useStatuses();
  const props = [...new Set(data.map((a) => a.property_id).filter(Boolean))].map(getProperty).filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader eyebrow="My Properties" title="My Properties" subtitle="Properties linked to your ULPIN applications." />
      {isLoading ? <div className="grid md:grid-cols-3 gap-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64" />)}</div>
        : props.length === 0 ? (
          <div className="bg-card border border-line rounded-xl"><EmptyState icon={Building2} title="No properties registered." text="Request a ULPIN for a property to link it to your account." actionLabel="Register Property" actionTo="/ulpin/request" /></div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {props.map((p) => {
              const s = statuses.get(p.id);
              return (
                <Link key={p.id} to={`/property/${p.id}`} className="bg-card border border-line rounded-xl overflow-hidden hover:shadow-md transition">
                  <PropertyPhoto property={p} className="aspect-[16/10]" />
                  <div className="p-4 space-y-2">
                    <p className="font-bold text-ink leading-snug">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.type} · {p.floorsLabel}</p>
                    <div className="flex flex-wrap gap-2"><StatusBadge status={s.verification_status} /><StatusBadge status={s.ulpin_status} /></div>
                    {s.ulpin && <p className="font-mono text-xs text-primary">{s.ulpin} · Demo ULPIN</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
    </div>
  );
}