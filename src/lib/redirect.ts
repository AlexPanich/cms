// Защита от open redirect: после входа уводим только на путь внутри сайта.
export function safeRedirectPath(value: string | null | undefined, fallback = "/admin"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
