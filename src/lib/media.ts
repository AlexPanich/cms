// Общие для клиента и сервера ограничения загрузки и адреса файлов.
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

export function mediaUrl(storageKey: string): string {
  return `/media/${storageKey}`;
}
