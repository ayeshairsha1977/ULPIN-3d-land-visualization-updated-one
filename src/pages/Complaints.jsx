import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquareWarning, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/common/PageHeader";
import FilterBar from "@/components/common/FilterBar";
import EmptyState from "@/components/common/EmptyState";
import ComplaintCard from "@/components/complaints/ComplaintCard";
import { useEntityList } from "@/hooks/useData";
import { useRole } from "@/hooks/useRole";
import { COMPLAINT_STATUSES, COMPLAINT_CATEGORIES } from "@/data/constants";
import { SORT_OPTIONS, sortByDate, withAll } from "@/lib/listUtils";

export default function Complaints() {
  const { user } = useRole();
  const { data = [], isLoading } = useEntityList("Complaint", { created_by_id: user?.id }, { enabled: !!user?.id });
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");

  const rows = sortByDate(data.filter((c) => (status === "all" || c.status === status) && (category === "all" || c.category === category)), sort);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader eyebrow="Complaint Tracking" title="My Complaints" subtitle="Report incorrect property information, boundary mismatches or ULPIN issues and follow their resolution."
        actions={<Button asChild><Link to="/complaints/new"><Plus className="w-4 h-4 mr-2" />Raise Complaint</Link></Button>} />
      <FilterBar filters={[
        { label: "Status", value: status, onChange: setStatus, options: withAll("All statuses", COMPLAINT_STATUSES) },
        { label: "Category", value: category, onChange: setCategory, options: withAll("All categories", COMPLAINT_CATEGORIES) },
        { label: "Date", value: sort, onChange: setSort, options: SORT_OPTIONS },
      ]} />
      {isLoading ? (
        <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <div className="bg-card border border-line rounded-xl">
          <EmptyState icon={MessageSquareWarning} title="No complaints yet." text="If something looks wrong on a property record, raise a complaint from its page." actionLabel="Raise Complaint" actionTo="/complaints/new" />
        </div>
      ) : (
        <div className="space-y-3">{rows.map((c, i) => <ComplaintCard key={c.id} complaint={c} defaultOpen={i === 0} />)}</div>
      )}
    </div>
  );
}