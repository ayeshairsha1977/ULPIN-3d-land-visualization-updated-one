import React, { useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { MAX_FILES_PER_UPLOAD, uploadPrivate, validateFiles } from "@/lib/files";

export default function EvidenceUpload({ files, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const add = async (list) => {
    const picked = Array.from(list || []);
    if (!picked.length) return;
    setErr("");
    setBusy(true);
    try {
      const invalid = await validateFiles(picked, files.length);
      if (invalid) return setErr(invalid);
      const uploaded = await Promise.all(picked.map(uploadPrivate));
      onChange([...files, ...uploaded]);
    } catch (error) {
      console.error("Evidence upload failed", error);
      setErr("We couldn't save that file. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Upload Evidence <span className="font-normal text-muted-foreground">(optional · PDF, JPG or PNG · max 10 MB each · up to {MAX_FILES_PER_UPLOAD} files)</span></Label>
      <label className="flex items-center justify-center gap-2 h-20 rounded-lg border border-dashed border-line text-sm text-muted-foreground cursor-pointer hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {busy ? "Uploading…" : "Add photos or documents"}
        <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={busy} onChange={(e) => add(e.target.files)} />
      </label>
      {err && <p className="text-xs text-red-600">{err}</p>}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm rounded-md border border-line px-3 py-2">
              <FileText className="w-4 h-4 text-primary" /><span className="flex-1 truncate">{f.name}</span>
              <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}><X className="w-4 h-4 text-muted-foreground" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}