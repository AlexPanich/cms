// id из сегмента URL; null, если это не положительное целое.
export function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
