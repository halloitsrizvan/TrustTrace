import clsx, { type ClassValue } from "clsx";
import { copy } from "./copy";

export const cn = (...a: ClassValue[]) => clsx(a);

/** Ticket number from an item id: stable, 4 digits. */
export function ticketNo(id: string) {
  const hex = id.replace(/[^0-9a-f]/gi, "").slice(-6) || "0";
  const n = parseInt(hex, 16) % 10000;
  return `No. ${String(n).padStart(4, "0")}`;
}

export function hashInt(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return m === 1 ? "1 minute ago" : `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "1 hour ago" : `${h} hours ago`;
  const d = Math.round(h / 24);
  if (d < 14) return d === 1 ? "1 day ago" : `${d} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function zoneName(z: string) {
  return copy.zone[z] ?? z;
}

/** Money arrives as integer paise; format to rupees only here. */
export function rupees(paise: number) {
  const r = paise / 100;
  return `₹${Number.isInteger(r) ? r : r.toFixed(2)}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function firstName(name: string) {
  return name.split(/\s+/)[0] ?? name;
}

export function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const HIGH_VALUE = ["PHONE", "GADGET", "ID_CARD", "WALLET"];

export const CATEGORIES = ["PHONE", "ID_CARD", "BOOK", "GADGET", "WALLET", "KEYS", "BAG", "OTHER"] as const;
export const ZONES = [
  "MAIN_GATE", "ACADEMIC_BLOCK", "LIBRARY", "HOSTELS", "CAFETERIA",
  "SPORTS_COMPLEX", "AUDITORIUM", "FEST_GROUNDS", "ADMIN_BLOCK",
] as const;
