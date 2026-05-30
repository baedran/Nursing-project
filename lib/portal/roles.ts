// Who the signed-in user is, for choosing which portal home to render.
export type PortalRole = "family" | "nurse" | "coordinator";

const VALID: readonly PortalRole[] = ["family", "nurse", "coordinator"];

/**
 * Resolve a portal role from a profile row. Anything unexpected (no profile,
 * unknown role string) falls back to the least-privileged role, "family".
 */
export function resolveRole(
  profile: { role?: string | null } | null | undefined,
): PortalRole {
  const role = profile?.role;
  return (VALID as readonly string[]).includes(role ?? "")
    ? (role as PortalRole)
    : "family";
}
