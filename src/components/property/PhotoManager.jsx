import React, { useRef, useState } from "react";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import Panel from "@/components/common/Panel";
import { Image } from "@/components/ui/image";
import { localClient } from "@/api/localClient";
import { useEntityList, useInvalidate } from "@/hooks/useData";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/components/ui/use-toast";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const EXT = /\.(jpe?g|png|webp)$/i;

export default function PhotoManager({ property }) {
  const { user, isGov } = useRole();
  const invalidate = useInvalidate();
  const { toast } = useToast();
  const { data: photos = [] } = useEntityList("PropertyPhoto", { property_id: property.id });
  const record = photos[0];
  const input = useRef(null);
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!isGov) return null;

  const fail = (description) => toast({ title: "Photo not accepted", description, variant: "destructive" });

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED.includes(file.type) || !EXT.test(file.name)) return fail("Only JPG, JPEG, PNG and WEBP photos are allowed.");
    if (file.size > 5 * 1024 * 1024) return fail("Photo must be smaller than 5 MB.");
    setPicked({ file, preview: URL.createObjectURL(file) });
  };

  const save = async () => {
    setBusy(true);
    try {
      const { file_uri } = await localClient.files.upload(picked.file);
      const payload = {
        property_id: property.id,
        file_uri,
        file_name: picked.file.name,
        uploaded_by: user?.full_name || user?.email || "",
      };
      if (record) await localClient.entities.PropertyPhoto.update(record.id, payload);
      else await localClient.entities.PropertyPhoto.create(payload);
      invalidate("PropertyPhoto");
      URL.revokeObjectURL(picked.preview);
      setPicked(null);
      toast({ title: record ? "Building photo replaced" : "Building photo uploaded", description: `Saved as the official photo for ${property.shortName}.` });
    } catch (error) {
      console.error("Saving building photo failed", error);
      fail("We couldn't save the photo. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await localClient.entities.PropertyPhoto.delete(record.id);
      invalidate("PropertyPhoto");
      toast({ title: "Building photo removed", description: "The property record and 3D twin continue to work normally." });
    } catch (error) {
      console.error("Removing building photo failed", error);
      fail("We couldn't remove the photo. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Building Reference Photo" icon={Camera}>
      <p className="text-xs text-muted-foreground mb-3">
        Official photo for <span className="font-semibold text-ink">{property.shortName}</span> ({property.propertyCode}).
        Visible to all roles — only a Government Administrator can upload, replace or remove it. Citizen complaint evidence stays separate.
      </p>
      <input ref={input} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={pick} aria-label="Upload building photo" />
      {picked ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-line overflow-hidden aspect-[16/9]">
            <Image src={picked.preview} alt="Photo preview" className="w-full h-full" fittingType="fill" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={save}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {record ? "Save (Replace)" : "Save"}
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => { URL.revokeObjectURL(picked.preview); setPicked(null); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={busy} onClick={() => input.current?.click()}>
              <Camera className="w-4 h-4 mr-2" />{record ? "Replace Photo" : "Upload Building Photo"}
            </Button>
            {record && (
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" disabled={busy} onClick={remove}>
                <Trash2 className="w-4 h-4 mr-2" />Remove Photo
              </Button>
            )}
          </div>
          {record && (
            <p className="text-[11px] text-muted-foreground">
              Current photo: {record.file_name} · uploaded by {record.uploaded_by || "Government Administrator"}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}