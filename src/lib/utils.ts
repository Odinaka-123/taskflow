import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  return date < new Date();
}

export function getPriorityColor(priority: string): string {
  return (
    {
      low: "text-slate-500 bg-slate-100",
      medium: "text-blue-600 bg-blue-50",
      high: "text-amber-600 bg-amber-50",
      urgent: "text-red-600 bg-red-50",
    }[priority] ?? "text-slate-500 bg-slate-100"
  );
}

export function getStatusColor(status: string): string {
  return (
    {
      todo: "text-slate-600 bg-slate-100",
      in_progress: "text-blue-600 bg-blue-50",
      in_review: "text-violet-600 bg-violet-50",
      done: "text-emerald-600 bg-emerald-50",
    }[status] ?? "text-slate-600 bg-slate-100"
  );
}
