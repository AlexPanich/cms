import { THEME_SETTINGS } from "@/theme/settings";
import { type Field, type Fields, type FieldsData, field, fieldsSchema } from "./blocks/define";
import { emptyFieldValue } from "./blocks/form";

// Настройки сайта: логотип, контакты, соцсети. Описаны полями блоков (src/lib/blocks/define.ts),
// хранятся одной записью (таблица site_settings), правятся в админке и на сайте. Тема
// добавляет свои в src/theme/settings.ts. Название, описание и текст подвала — в SITE_TEXTS.
// Меняются только совместимо, как схемы блоков: поля не переименовываются.

// Ключи соцсетей. Как выглядит каждая, решает тема; новые добавляются в конец.
export const SOCIAL_NETWORKS = [
  { value: "vk", label: "ВКонтакте" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "max", label: "MAX" },
  { value: "youtube", label: "YouTube" },
  { value: "rutube", label: "Rutube" },
  { value: "dzen", label: "Дзен" },
  { value: "ok", label: "Одноклассники" },
  { value: "other", label: "Другое" },
] as const;

export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number]["value"];

// Настройки ядра: на них опирается блок «Контакты» и JSON-LD организации.
export const CORE_SETTINGS = {
  logo: field.image({ label: "Логотип", help: "Если не задан, в шапке — название сайта" }),
  phone: field.text({ label: "Телефон", max: 30, format: "phone" }),
  email: field.text({ label: "Почта", max: 200, format: "email" }),
  address: field.text({ label: "Адрес", max: 300, multiline: true }),
  hours: field.text({ label: "Часы работы", max: 300, multiline: true }),
  socials: field.list(
    {
      // Соцсеть, которую убрали из списка, становится «Другое».
      network: field.select({ label: "Соцсеть", options: SOCIAL_NETWORKS, default: "other" }),
      url: field.text({ label: "Адрес страницы", required: true, max: 500, format: "url" }),
    },
    { label: "Соцсети", itemLabel: "Соцсеть", max: 12 },
  ),
} as const;

// Настройки ядра идут последними: тема не может подменить их своими полями с тем же именем
// (это проверяет src/lib/blocks/theme.test.ts).
export const SITE_SETTINGS = { ...THEME_SETTINGS, ...CORE_SETTINGS } as const;

export type SiteSettingsKey = keyof typeof SITE_SETTINGS;

export type SiteSettings = FieldsData<typeof SITE_SETTINGS>;

export const siteSettingsSchema = fieldsSchema(SITE_SETTINGS);

// Часть настроек для формы правки на сайте.
export function pickSettingsFields(names: readonly SiteSettingsKey[]): Fields {
  return Object.fromEntries(names.map((name) => [name, SITE_SETTINGS[name]]));
}

// Настройки из БД. Значение, которое больше не проходит схему (тема изменила поле, запись
// в обход сервиса), заменяется пустым — остальные настройки остаются.
export function readSiteSettings(raw: unknown): SiteSettings {
  const data = raw !== null && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(
    Object.entries(SITE_SETTINGS).map(([name, item]: [string, Field]) => {
      const parsed = item.schema.safeParse(data[name]);
      return [name, parsed.success ? parsed.data : emptyFieldValue(item)];
    }),
  ) as SiteSettings;
}

// Телефон в том виде, как его записали, — без пробелов, скобок и дефисов: «+79991234567».
export function normalizePhone(phone: string): string {
  return `${phone.trim().startsWith("+") ? "+" : ""}${phone.replace(/\D/g, "")}`;
}

export function phoneHref(phone: string): string {
  return `tel:${normalizePhone(phone)}`;
}

export function socialNetworkLabel(network: SocialNetwork): string {
  return SOCIAL_NETWORKS.find((item) => item.value === network)?.label ?? network;
}
