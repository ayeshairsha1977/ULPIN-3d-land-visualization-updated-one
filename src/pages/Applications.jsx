import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/common/PageHeader";
import FilterBar from "@/components/common/FilterBar";
import EmptyState from "@/components/common/EmptyState";
import ApplicationCard from "@/components/applications/ApplicationCard";
import { useEntityList } from "@/hooks/useData";
import { useRole } from "@/hooks/useRole";
import { APP_STATUSES, PROPERTY_CATEGORIES } from "@/data/constants";
import { getProperty } from "@/data/properties";
import { SORT_OPTIONS, sortByDate, withAll } from "@/lib/listUtils";

export default function Applications() {
  const { user } = useRole();
  const { data = [], isLoading } = useEntityList("ULPINApplication", { created_by_id: user?.id }, { enabled: !!user?.id });
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("newest");

  const rows = sortByDate(data.filter((a) =>
    (status === "all" || a.status === status) &&
    (type === "all" || getProperty(a.property_id)?.category === type)), sort);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader eyebrow="Application Tracking" title="My ULPIN Applications" subtitle="Track each demo application through GIS validation, verification and approval."
        actions={<Button asChild><Link to="/ulpin/request"><Plus className="w-4 h-4 mr-2" />Request ULPIN</Link></Button>} />
      <FilterBar filters={[
        { label: "Status", value: status, onChange: setStatus, options: withAll("All statuses", APP_STATUSES) },
        { label: "Property Type", value: type, onChange: setType, options: withAll("All property types", PROPERTY_CATEGORIES) },
        { label: "Date", value: sort, onChange: setSort, options: SORT_OPTIONS },
      ]} />
      {isLoading ? (
        <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <div className="bg-card border border-line rounded-xl">
          <EmptyState icon={ClipboardList} title="No ULPIN applications yet." text="Start from a property on the map or fill in the request form." actionLabel="Request ULPIN" actionTo="/ulpin/request" />
        </div>
      ) : (
        <div className="space-y-3">{rows.map((a, i) => <ApplicationCard key={a.id} app={a} defaultOpen={i === 0} />)}</div>
      )}
    </div>
  );
}