"use client";
import { Chip } from "./chip";
import { categoryIcons } from "@/components/tag/ItemPhoto";
import { copy } from "@/lib/copy";
import { CATEGORIES, ZONES } from "@/lib/utils";
import { MapPin, Package } from "lucide-react";

/** Area picker as a wrap of pill chips: no native dropdown, thumb-sized, shows every option at once. */
export function ZoneSelect({
  value,
  onChange,
  anyLabel,
  id,
  ...aria
}: {
  value: string;
  onChange: (v: string) => void;
  /** When set, tapping the selected area again clears it. */
  anyLabel?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
}) {
  const clearable = anyLabel !== undefined;
  return (
    <div
      id={id}
      role="group"
      aria-label={aria["aria-label"] ?? copy.report.zone}
      aria-describedby={aria["aria-describedby"]}
      data-testid="zone-select"
      className="flex flex-wrap gap-2"
    >
      {ZONES.map((z) => (
        <Chip
          key={z}
          selected={value === z}
          onClick={() => onChange(clearable && value === z ? "" : z)}
          icon={<MapPin size={15} strokeWidth={1.75} aria-hidden />}
          testid={`zone-${z}`}
        >
          {copy.zone[z]}
        </Chip>
      ))}
    </div>
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
