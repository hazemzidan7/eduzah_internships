"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createCourse } from "@/lib/actions/courses";
import { useLanguage } from "@/lib/language-context";
import { translations } from "@/lib/translations";
import { Card, Input, Textarea, Select, Button } from "@/components/ui";
import { Loader2, ImagePlus, X } from "lucide-react";

const CATEGORIES = ["Technology", "Management", "English", "Kids"];

export function NewCourseForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const tr = translations[language].newCourseForm;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function clearBanner() {
    setFile(null);
    setPreview(null);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      if (file) {
        const supabase = createClient();
        const path = `banners/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const { error: uploadError } = await supabase.storage.from("course-banners").upload(path, file);
        if (uploadError) {
          setError(`Image upload failed: ${uploadError.message}`);
          setLoading(false);
          return;
        }
        const { data } = supabase.storage.from("course-banners").getPublicUrl(path);
        formData.set("banner_url", data.publicUrl);
      }
      await createCourse(formData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{tr.title}</label>
          <Input name="title" required />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{tr.description}</label>
          <Textarea name="description" required rows={4} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{tr.category}</label>
            <Select name="category" required defaultValue="">
              <option value="" disabled>{tr.selectCategory}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{tr.status}</label>
            <Select name="status" defaultValue="draft">
              <option value="draft">{tr.statusDraft}</option>
              <option value="active">{tr.statusActive}</option>
              <option value="archived">{tr.statusArchived}</option>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{tr.duration}</label>
          <Input name="duration_text" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{tr.bannerImage}</label>
          {preview ? (
            <div className="relative overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Banner preview" className="h-44 w-full object-cover" />
              <button
                type="button"
                onClick={clearBanner}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-muted text-foreground/50 transition hover:border-primary/50 hover:text-primary/70">
              <ImagePlus size={28} />
              <span className="text-sm font-medium">{tr.clickToUpload}</span>
              <span className="text-xs">{tr.imageFormats}</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {tr.createCourse}
          </Button>
        </div>
      </form>
    </Card>
  );
}
