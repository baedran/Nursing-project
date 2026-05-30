"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/i18n";

type PhotoEntry = { id: string; caption: string; url: string };

type Props = {
  summaryId: string;
  visitId: string;
  familyId: string;
  dict: Dictionary;
  initialPhotos: PhotoEntry[];
};

export default function WoundPhotoUploader({
  summaryId,
  visitId,
  familyId,
  dict,
  initialPhotos,
}: Props) {
  const t = dict.portal.writer;
  const [photos, setPhotos] = useState<PhotoEntry[]>(initialPhotos);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `families/${familyId}/visit-${visitId}/${crypto.randomUUID()}.${ext}`;

    setUploading(true);
    setUploadError(null);

    const supabase = createClient();

    const { error: storageError } = await supabase.storage
      .from("wound-photos")
      .upload(path, file);

    if (storageError) {
      setUploadError(storageError.message);
      setUploading(false);
      e.target.value = "";
      return;
    }

    const { data: insertData, error: insertError } = await supabase
      .from("wound_photos")
      .insert({
        visit_summary_id: summaryId,
        storage_path: path,
        caption: caption.trim() || null,
      })
      .select("id")
      .single();

    if (insertError || !insertData) {
      setUploadError(insertError?.message ?? "Insert failed");
      setUploading(false);
      e.target.value = "";
      return;
    }

    const { data: signed } = await supabase.storage
      .from("wound-photos")
      .createSignedUrl(path, 3600);

    if (signed?.signedUrl) {
      setPhotos((prev) => [
        ...prev,
        { id: (insertData as any).id, caption: caption.trim(), url: signed.signedUrl },
      ]);
    }

    setCaption("");
    e.target.value = "";
    setUploading(false);
  }

  async function handleRemove(photoId: string) {
    const supabase = createClient();
    await supabase.from("wound_photos").delete().eq("id", photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  const labelClass = "font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft";
  const inputClass =
    "rounded-lg border border-rule bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-teal w-full";

  return (
    <div className="flex flex-col gap-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
        {t.photos}
      </div>

      {photos.length > 0 && (
        <div className="flex flex-col gap-3">
          {photos.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-rule bg-paper-cool px-4 py-3"
            >
              <div className="size-12 shrink-0 overflow-hidden rounded-md border border-rule bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.caption || "Wound photo"}
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                {p.caption && (
                  <div className="truncate text-[13px] text-ink-soft">{p.caption}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(p.id)}
                className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-peach transition hover:opacity-70"
              >
                {t.remove}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-2">
          <span className={labelClass}>{t.photoCaption}</span>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t.photoCaption}
            className={inputClass}
            disabled={uploading}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>{t.addPhoto}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="w-full rounded-lg border border-rule bg-white px-4 py-3 text-[13px] text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-paper-cool file:px-3 file:py-1 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.14em] file:text-ink-soft"
          />
        </label>

        {uploading && (
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
            {t.uploading}
          </div>
        )}

        {uploadError && (
          <div className="rounded-md border border-peach bg-peach/10 px-3 py-2 text-[13px] text-ink">
            {uploadError}
          </div>
        )}
      </div>
    </div>
  );
}