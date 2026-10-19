export const PAGE_SIZE = 20;

export function parsePage(value: unknown): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function parseSearch(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}

export function pageCount(total: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

// Экранирует % и _ для поиска через ILIKE.
export function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}
