"use client";
import { useId, useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { copy } from "@/lib/copy";
import { PhotoTooBig, uploadPhoto } from "@/lib/upload";
import { Button } from "./button";

/** Camera capture on mobile, resize, upload. Reports the final URL through onChange. */
export function PhotoPicker({
  value,
  onChange,
  error,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  error?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function pick(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    setMsg(null);
    try {
      onChange(await uploadPhoto(f));
    } catch (e) {
      setMsg(e instanceof PhotoTooBig ? copy.report.photoTooBig : copy.report.photoFailed);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        data-testid="photo-input"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {value ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={copy.report.photoReady} className="aspect-[4/3] w-full rounded-[6px] object-cover" />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => input.current?.click()} disabled={busy}>
              {copy.action.replacePhoto}
            </Button>
            <Button variant="ghost" onClick={() => onChange(null)} disabled={busy}>
              <Trash2 size={17} strokeWidth={1.75} aria-hidden /> {copy.action.removePhoto}
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-rule bg-surface p-6 text-center hover:bg-ultra-tint focus-within:outline-2"
        >
          {busy ? <Loader2 className="animate-spin" size={30} strokeWidth={1.75} aria-hidden /> : <Camera size={30} strokeWidth={1.75} aria-hidden />}
          <span className="font-bold">{busy ? copy.report.photoUploading : copy.action.takePhoto}</span>
        </label>
      )}
      <p role="status" className="sr-only">{busy ? copy.report.photoUploading : ""}</p>
      {msg || error ? (
        <p role="alert" className="text-sm font-bold text-rejected-ink">
          {msg ?? error}
        </p>
      ) : null}
    </div>
  );
}
