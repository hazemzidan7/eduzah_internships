"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, Input, Select, Button } from "@/components/ui";
import { addMaterial } from "@/lib/actions/sessions";
import { Loader2 } from "lucide-react";
import type { MaterialType } from "@/lib/types";

const TYPE_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "ppt", label: "Presentation" },
  { value: "doc", label: "Document" },
  { value: "zip", label: "ZIP Archive" },
  { value: "video", label: "Video" },
  { value: "link", label: "External Link" },
];

export function AddMaterialDialog({
  open,
  onOpenChange,
  courseId,
  sessionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  sessionId: string;
}) {
  const [type, setType] = useState<MaterialType>("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const title = formData.get("title") as string;

    try {
      if (type === "link") {
        const url = formData.get("url") as string;
        await addMaterial(courseId, sessionId, { title, type, url });
      } else {
        const file = formData.get("file") as File;
        if (!file || file.size === 0) {
          setError("Please choose a file to upload.");
          setLoading(false);
          return;
        }
        const supabase = createClient();
        const path = `${sessionId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("course-media").upload(path, file);
        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = supabase.storage.from("course-media").getPublicUrl(path);
        await addMaterial(courseId, sessionId, { title, type, url: urlData.publicUrl, size_bytes: file.size });
      }

      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Add Material" description="Upload a file or link a resource to this session.">
      <form action={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Title</label>
          <Input name="title" required placeholder="e.g. Lecture slides" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Type</label>
          <Select value={type} onChange={(e) => setType(e.target.value as MaterialType)}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        {type === "link" ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">URL</label>
            <Input name="url" required placeholder="https://..." />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">File</label>
            <input name="file" type="file" required className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground" />
          </div>
        )}
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            Add Material
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
