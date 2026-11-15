import { post } from "./api/client";
import type { SignedUpload } from "./api/types";

const MAX_EDGE = 1600;
const MAX_BYTES = 5 * 1024 * 1024;
const PUBLIC_BASE = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL ?? "";

export class PhotoTooBig extends Error {}

function toBlob(c: HTMLCanvasElement, q: number) {
  return new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", q));
}

/** Client-side resize to max 1600px and compress to 5MB or less. */
export async function prepareImage(file: File, maxEdge = MAX_EDGE): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  for (const q of [0.85, 0.7, 0.55, 0.4]) {
    const b = await toBlob(c, q);
    if (b.size <= MAX_BYTES) return b;
  }
  throw new PhotoTooBig();
}

/** Returns the public image URL to send in the item payload. */
export async function uploadPhoto(file: File): Promise<string> {
  const blob = await prepareImage(file);
  const signed = await post<SignedUpload>("/uploads/sign", { contentType: "image/jpeg", purpose: "public" });
  const put = await fetch(signed.signedUrl, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob });
  if (!put.ok) throw new Error("upload");
  return signed.publicUrl ?? `${PUBLIC_BASE}/${signed.path}`;
}
