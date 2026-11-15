"use client";
import { Chip } from "./chip";
import { Select } from "./field";
import { categoryIcons } from "@/components/tag/ItemPhoto";
import { copy } from "@/lib/copy";
import { CATEGORIES, ZONES } from "@/lib/utils";
import { Package } from "lucide-react";

export function ZoneSelect({
  value,
  onChange,
  anyLabel,
  id,
  ...aria
}: {
  value: string;
  onChange: (v: string) => void;
  anyLabel?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
}) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} data-testid="zone-select" {...aria}>
      {anyLabel !== undefined ? <option value="">{anyLabel}</option> : <option value="" disabled>{copy.report.zone}</option>}
      {ZONES.map((z) => (
        <option key={z} value={z}>
          {copy.zone[z]}
        </option>
      ))}
    </Select>
  );
}

export function CategoryChips({
  value,
  onChange,
  allowNone,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  allowNone?: boolean;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      {allowNone ? (
        <Chip selected={value === ""} onClick={() => onChange("")}>
          {copy.board.all}
        </Chip>
      ) : null}
      {CATEGORIES.map((c) => {
        const Icon = categoryIcons[c] ?? Package;
        return (
          <Chip
            key={c}
            selected={value === c}
            onClick={() => onChange(allowNone && value === c ? "" : c)}
            icon={<Icon size={16} strokeWidth={1.75} aria-hidden />}
            testid={`category-${c}`}
          >
            {copy.category[c]}
          </Chip>
        );
      })}
    </div>
  );
}
