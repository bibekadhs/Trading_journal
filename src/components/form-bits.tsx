"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function SelectField<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function NumberInput({
  value,
  onChange,
  step = "0.25",
  placeholder,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  step?: string;
  placeholder?: string;
}) {
  return (
    <Input
      type="number"
      step={step}
      value={value === "" ? "" : value}
      placeholder={placeholder}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? "" : Number(v));
      }}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

const TRI: Array<"Yes" | "No" | "Skipped"> = ["Yes", "No", "Skipped"];
const TRI_TONE: Record<"Yes" | "No" | "Skipped", string> = {
  Yes: "bg-emerald-500 text-black hover:bg-emerald-400",
  No: "bg-rose-500 text-white hover:bg-rose-400",
  Skipped: "bg-amber-500 text-black hover:bg-amber-400",
};

export function TriToggle({
  value,
  onChange,
}: {
  value: "Yes" | "No" | "Skipped";
  onChange: (v: "Yes" | "No" | "Skipped") => void;
}) {
  return (
    <div className="flex gap-1">
      {TRI.map((opt) => (
        <Button
          key={opt}
          type="button"
          variant={value === opt ? "default" : "outline"}
          size="sm"
          className={cn("h-7 flex-1", value === opt && TRI_TONE[opt])}
          onClick={() => onChange(opt)}
        >
          {opt}
        </Button>
      ))}
    </div>
  );
}

export function MultiTag<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: readonly T[];
  selected: T[];
  onChange: (v: T[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <Badge
            key={o}
            variant={on ? "default" : "outline"}
            className={cn("cursor-pointer select-none", on && "bg-primary")}
            onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
          >
            {o}
          </Badge>
        );
      })}
    </div>
  );
}

// Single-select setup picker with localStorage persistence.
// Users can click a saved badge to select it, type a new one,
// or remove saved items.
export function SetupSelect({
  value,
  onChange,
  storageKey = "tj-primary-setups",
}: {
  value: string;
  onChange: (v: string) => void;
  storageKey?: string;
}) {
  const [options, setOptions] = React.useState<string[]>([]);
  const [input, setInput] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setOptions(Array.isArray(saved) ? saved : []);
    } catch {
      setOptions([]);
    }
  }, [storageKey]);

  const saveOptions = React.useCallback(
    (opts: string[]) => {
      setOptions(opts);
      localStorage.setItem(storageKey, JSON.stringify(opts));
    },
    [storageKey],
  );

  const addOption = React.useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      if (!options.includes(trimmed)) {
        saveOptions([...options, trimmed]);
      }
      onChange(trimmed);
      setInput("");
    },
    [options, saveOptions, onChange],
  );

  const removeOption = React.useCallback(
    (opt: string) => {
      const next = options.filter((o) => o !== opt);
      saveOptions(next);
      if (value === opt) onChange("");
    },
    [options, saveOptions, value, onChange],
  );

  const allOptions = React.useMemo(() => {
    const list = [...options];
    if (value && !list.includes(value)) list.unshift(value);
    return list;
  }, [options, value]);

  return (
    <div className="grid gap-2">
      {/* Saved options */}
      <div className="flex flex-wrap gap-1.5">
        {allOptions.map((o) => {
          const on = value === o;
          return (
            <Badge
              key={o}
              variant={on ? "default" : "outline"}
              className={cn(
                "cursor-pointer select-none gap-1 pr-1.5",
                on && "bg-primary",
              )}
              onClick={() => onChange(on ? "" : o)}
            >
              {o}
              <span
                className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[10px] hover:bg-black/20"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(o);
                }}
                title="Remove"
              >
                ×
              </span>
            </Badge>
          );
        })}
      </div>

      {/* Add new */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOption(input);
            }
          }}
          placeholder="Type new setup and add…"
          className="h-8 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => addOption(input)}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
