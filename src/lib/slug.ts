// Только латиница в нижнем регистре, цифры и одиночные дефисы между ними.
// То же правило закреплено CHECK-ограничением в таблице pages.
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Адреса первого уровня, занятые разделами приложения: корневая страница с таким slug
// была бы недоступна, потому что маршрут раздела важнее страниц из дерева.
export const RESERVED_ROOT_SLUGS: readonly string[] = [
  "admin",
  "api",
  "articles",
  "login",
  "media",
  "search",
];

const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function slugify(input: string): string {
  return (
    Array.from(input.toLowerCase(), (char) => CYRILLIC[char] ?? char)
      .join("")
      // NFKD раскладывает лигатуры и символы вроде «№» → «No», поэтому регистр приводим повторно.
      .normalize("NFKD")
      .toLowerCase()
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}
