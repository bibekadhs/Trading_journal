"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function MaskedValue({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span
      className={cn("cursor-pointer select-none tracking-widest", className)}
      onClick={() => setRevealed(true)}
      title="Click to reveal"
    >
      *****
    </span>
  );
}
