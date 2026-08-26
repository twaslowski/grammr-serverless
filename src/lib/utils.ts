import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function instanceUrl() {
  return process.env.NEXT_PUBLIC_APPLICATION_URL
    ? process.env.NEXT_PUBLIC_APPLICATION_URL
    : "http://localhost:3000";
}
