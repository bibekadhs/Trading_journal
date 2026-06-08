export function fmt$(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function fmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
