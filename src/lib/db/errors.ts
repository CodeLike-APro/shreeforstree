/**
 * Postgres unique-constraint violation (SQLSTATE 23505). Drizzle may surface
 * the driver error directly or wrap it as the `cause` of a query error.
 */
export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; cause?: unknown };
  if (err.code === "23505") return true;
  const cause = err.cause as { code?: unknown } | undefined;
  return cause?.code === "23505";
}
