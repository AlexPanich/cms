import { phoneHref, type SiteSettings, socialNetworkLabel } from "@/lib/site-settings";
import { cn } from "@/lib/utils";

// Контакты из настроек сайта: подвал и блок «Контакты». Пустые поля не выводятся.

// Настройки, которые правятся на сайте вместе с контактами (EditableSettings).
export const CONTACT_SETTINGS = ["phone", "email", "address", "hours", "socials"] as const;

export function hasContacts(settings: SiteSettings, socials = true): boolean {
  const { phone, email, address, hours } = settings;
  return Boolean(phone || email || address || hours || (socials && settings.socials.length > 0));
}

export function Contacts({
  settings,
  socials = true,
  className,
}: {
  settings: SiteSettings;
  socials?: boolean;
  className?: string;
}) {
  if (!hasContacts(settings, socials)) return null;
  const { phone, email, address, hours } = settings;
  const items = [
    phone && {
      label: "Телефон",
      value: (
        <a href={phoneHref(phone)} className="hover:underline">
          {phone}
        </a>
      ),
    },
    email && {
      label: "Почта",
      value: (
        <a href={`mailto:${email}`} className="hover:underline">
          {email}
        </a>
      ),
    },
    address && { label: "Адрес", value: address },
    hours && { label: "Часы работы", value: hours },
  ].filter((item) => !!item);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {items.length > 0 && (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[auto_1fr]">
          {items.map((item) => (
            <div key={item.label} className="contents">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="whitespace-pre-line">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {socials && settings.socials.length > 0 && (
        <ul aria-label="Соцсети" className="flex flex-wrap gap-2">
          {settings.socials.map((item, index) => (
            <li key={index}>
              <a
                href={item.url}
                rel="noopener"
                className="hover:bg-muted inline-flex h-8 items-center rounded-md border px-3 text-sm transition-colors"
              >
                {socialNetworkLabel(item.network)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
