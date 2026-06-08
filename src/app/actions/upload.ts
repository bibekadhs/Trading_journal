"use server";

import { put } from "@vercel/blob";
import { requireUserId } from "@/lib/auth";

// Client compresses the image to a JPEG ≤ 1200px before sending.
// We just take the bytes and push them to Blob storage under a path
// scoped to the caller, then return the public URL.
export async function uploadScreenshot(formData: FormData): Promise<{ url: string }> {
  const userId = await requireUserId();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  if (file.size > 5 * 1024 * 1024) throw new Error("File too large (max 5 MB)");

  const ext = file.type === "image/png" ? "png" : "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const blob = await put(`screenshots/${userId}/${filename}`, file, {
    access: "public",
    contentType: file.type || "image/jpeg",
  });
  return { url: blob.url };
}
