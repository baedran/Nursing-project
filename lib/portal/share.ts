import { randomBytes } from "node:crypto";

/** How long a share link stays valid. */
export const SHARE_TTL_DAYS = 30;

/**
 * An unguessable, URL-safe token for a share link. 24 random bytes → 32
 * base64url chars (~192 bits of entropy), no padding, safe in a URL path.
 */
export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Expiry timestamp: SHARE_TTL_DAYS after `start` (defaults to now). */
export function shareExpiry(start: Date = new Date()): Date {
  return new Date(start.getTime() + SHARE_TTL_DAYS * 24 * 60 * 60 * 1000);
}
