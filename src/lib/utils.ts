import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatTime(isoStr: string | null): string {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(isoStr: string | null): string {
  if (!isoStr) return "—";
  return new Date(isoStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isWithinOutreachWindow(): boolean {
  const h = new Date().getHours();
  // Based on old app: 0 to 21 (9 PM)
  return h >= 0 && h < 21;
}

export function secondsUntil9PM(): number {
  const now = new Date();
  const ninepm = new Date(now);
  ninepm.setHours(21, 0, 0, 0);
  if (ninepm <= now) return 0;
  return Math.floor((ninepm.getTime() - now.getTime()) / 1000);
}

export function toHHMMSS(secs: number): string {
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function formatPhone(raw: string): string {
  let p = String(raw).replace(/[\s\-\(\)\+\.]/g, '').replace(/\D/g, '');
  // Default to Nigeria code base as in original script, but generalized easily
  if (p.startsWith('0')) p = '234' + p.slice(1);
  else if (p.length === 10) p = '234' + p;
  else if (!p.startsWith('234')) p = '234' + p;
  return p;
}
