import React from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Info } from "lucide-react";
import { getProperty } from "@/data/properties";
import { useStatuses } from "@/hooks/useData";
import { Skeleton } from "@/components/ui/skeleton";
import PropertyNotFound from "@/components/common/PropertyNotFound";
import Panel from "@/components/common/Panel";
import InfoGrid from "@/components/common/InfoGrid";
import PropertyHero from "@/components/property/PropertyHero";
import UlpinCard from "@/components/property/UlpinCard";
import FloorCards from "@/components/property/FloorCards";
import HistoryCard from "@/components/property/HistoryCard";
import DocumentsCard from "@/components/property/DocumentsCard";
import ComplaintHistoryCard from "@/components/property/ComplaintHistoryCard";
import VerificationCard from "@/components/property/VerificationCard";
import PhotoManager from "@/components/property/PhotoManager";
import AIAnalysisCard from "@/components/property/AIAnalysisCard";
import { propertyFields } from "@/components/property/propertyFields";

export default function PropertyDetails() {
  const { id } = useParams();
  const property = getProperty(id);
  const statuses = useStatuses();
  if (!property) return <PropertyNotFound />;
  const status = statuses.get(id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link to={`/map?property=${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"><ChevronLeft className="w-4 h-4" />Back to Map</Link>
      {statuses.isLoading ? <Skeleton className="h-80 w-full rounded-2xl" /> : <PropertyHero property={property} status={status} />}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <Panel title="Property Information" icon={Info}>
          <InfoGrid items={propertyFields(property, status)} cols="sm:grid-cols-2 xl:grid-cols-3" />
          {property.layoutNote && <p className="mt-4 text-xs text-amber-700">{property.layoutNote}</p>}
        </Panel>
        <UlpinCard property={property} status={status} />
      </div>
      <FloorCards property={property} />
      <div className="grid lg:grid-cols-2 gap-6">
        <PhotoManager property={property} />
        <HistoryCard property={property} />
        <AIAnalysisCard property={property} />
        <DocumentsCard property={property} />
        <VerificationCard property={property} />
      </div>
      <ComplaintHistoryCard property={property} />
    </div>
  );
}