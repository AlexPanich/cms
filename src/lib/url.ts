const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

// Ссылка, которую можно отдать в href: путь на сайте («/about», «/#contacts») или абсолютный
// URL с протоколом из белого списка. javascript:, data: и т. п. отклоняются.
// «//host» и «/\host» браузеры понимают как ссылку на другой сайт — их тоже отклоняем,
// внешние ссылки пишутся с протоколом.
export function isSafeLinkUrl(value: string): boolean {
  if (value !== value.trim() || value === "") return false;
  if (value.startsWith("/")) {
    return !value.startsWith("//") && !value.includes("\\") && !/[\s\p{Cc}]/u.test(value);
  }
  try {
    return SAFE_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}
