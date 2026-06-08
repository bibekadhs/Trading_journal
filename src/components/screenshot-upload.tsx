"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadScreenshot } from "@/app/actions/upload";

function compress(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > height && width > MAX) {
          height = (height * MAX) / width;
          width = MAX;
        } else if (height >= width && height > MAX) {
          width = (width * MAX) / height;
          height = MAX;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.6);
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = String(e.target?.result ?? "");
    };
    reader.readAsDataURL(file);
  });
}

export function ScreenshotUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const blob = await compress(file);
      const form = new FormData();
      form.append("file", new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
      const { url } = await uploadScreenshot(form);
      onChange(url);
      toast.success(`${label} uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {value ? (
        <div className="relative">
          <Image
            src={value}
            alt={label}
            width={400}
            height={240}
            className="h-32 w-full rounded-md border object-cover"
            unoptimized
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-1 right-1 h-7"
            onClick={() => onChange(null)}
          >
            Remove
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="h-32 border-dashed text-sm text-muted-foreground"
        >
          {busy ? "Uploading…" : `Click to upload ${label}`}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
