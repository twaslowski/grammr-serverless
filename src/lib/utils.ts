import { type ClassValue, clsx } from "clsx";
import { camel } from "radash";
import { twMerge } from "tailwind-merge";


// Magical Claude code to convert snake_case to camelCase for better DB mapping
export function snakeToCamel<T extends Record<string, unknown>>(
    obj: T
): Record<string, unknown> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[camel(key)] = value;
    return acc;
  }, {} as Record<string, unknown>);
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function instanceUrl() {
  return process.env.NEXT_PUBLIC_APPLICATION_URL
    ? process.env.NEXT_PUBLIC_APPLICATION_URL
    : "http://localhost:3000";
}
