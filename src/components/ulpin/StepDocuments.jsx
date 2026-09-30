import React, { useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { DOC_SLOTS } from "@/components/ulpin/formModel";
import { uploadPrivate, validateFile } from "@/lib/files";

export default function StepDocuments({ form, patch, errors }) {
  const [busy, setBusy] = useState("");
  const [slotErr, setSlotErr] = useState({});
  const setSlotError = (label, message) => setSlotErr((prev) => ({ ...prev, [label]: message }));

  const onFile = async (label, file) => {
    if (!file) return;
    setSlotError(label, "");
    setBusy(label);
    try {
      const invalid = await validateFile(file);
      if (invalid) return setSlotError(label, invalid);
      const doc = await uploadPrivate(file);
      patch({ documents: [...form.documents.filter((d) => d.label !== label), { label, ...doc }] });
    } catch (error) {
      console.error("Document upload failed", error);
      setSlotError(label, "We couldn't save that file. Please try again.");
    } finally {
      setBusy("");
    }
  };
  const remove = (label) => patch({ documents: form.documents.filter((d) => d.label !== label) });

  return (
    <div className="space-y-3">
      {DOC_SLOTS.map((label) => {
        const doc = form.documents.find((d) => d.label === label);
        return (
          <div key={label} className="rounded-lg border border-line p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">{label}{label === "Ownership Document" && <span className="text-red-600"> *</span>}</p>
              {doc ? <p className="text-xs text-primary flex items-center gap-1 truncate"><FileText className="w-3.5 h-3.5" />{doc.name}</p>
                : <p className="text-xs text-muted-foreground">PDF, JPG or PNG · max 10 MB</p>}
              {slotErr[label] && <p className="text-xs text-red-600 mt-1">{slotErr[label]}</p>}
            </div>
            {doc ? (
              <button type="button" onClick={() => remove(label)} className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-line text-sm hover:bg-muted"><X className="w-3.5 h-3.5" />Remove</button>
            ) : (
              <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-line text-sm font-medium cursor-pointer hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
                {busy === label ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {busy === label ? "Uploading…" : "Upload"}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={!!busy} onChange={(e) => onFile(label, e.target.files?.[0])} />
              </label>
            )}
          </div>
        );
      })}
      {errors.documents && <p className="text-sm text-red-600">{errors.documents}</p>}
      <p className="text-xs text-muted-foreground">Demo storage: files stay in this browser (IndexedDB) and are not uploaded to any server. Do not upload real ownership documents.</p>
    </div>
  );
}