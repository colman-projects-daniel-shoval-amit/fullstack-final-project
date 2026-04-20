import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDateFromId(id: string): Date {
  return new Date(parseInt(id.substring(0, 8), 16) * 1000);
}

export function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/uploads/')) return `${import.meta.env.VITE_API_BASE_URL}${url}`;
  return url;
}
