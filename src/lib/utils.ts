import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Only allow same-site paths as post-login redirects (prevents open redirects).
 * Rejects absolute URLs, protocol-relative "//x", "/\x" (browsers read "\" as "/"),
 * and control characters, then double-checks the result stays on a dummy origin.
 */
export function safeRedirect(to: unknown, fallback = "/dashboard"): string {
  if (typeof to !== "string" || !to.startsWith("/") || to.length > 2048) return fallback;
  // biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting control characters is the point
  if (/^\/[\\/]|\\|[\u0000-\u001f\u007f]/.test(to)) return fallback;
  try {
    const url = new URL(to, "https://app.invalid");
    if (url.origin !== "https://app.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase() || "?";
}
