import { field, type Fields } from "@/lib/blocks/define";

// Своя настройка темы — слоган в шапке.
export const THEME_SETTINGS = {
  slogan: field.text({ label: "Слоган", max: 120, help: "Под названием сайта в шапке" }),
} as const satisfies Fields;
