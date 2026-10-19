type PgErrorFields = { code: string; constraint_name?: string };

// Drizzle оборачивает ошибку драйвера в DrizzleQueryError, исходная лежит в cause.
function findPgError(error: unknown): PgErrorFields | undefined {
  let current: unknown = error;
  while (current instanceof Error) {
    if ("code" in current && typeof current.code === "string") {
      return current as Error & PgErrorFields;
    }
    current = current.cause;
  }
  return undefined;
}

export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  const pgError = findPgError(error);
  return (
    pgError?.code === "23505" &&
    (constraint === undefined || pgError.constraint_name === constraint)
  );
}

export function isForeignKeyViolation(error: unknown): boolean {
  return findPgError(error)?.code === "23503";
}
