const sizeFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

export function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${sizeFormat.format(bytes / 1024)} КБ`
    : `${sizeFormat.format(bytes / 1024 / 1024)} МБ`;
}
