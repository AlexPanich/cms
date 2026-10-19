import { z } from "zod";

// Единственная точка импорта zod в проекте (правило ESLint): здесь настраиваются русские
// сообщения об ошибках — и на сервере, и в браузере (zodResolver форм).

// После «не длиннее», «не больше» — родительный падеж: 1 и 21 символа, 2, 5 и 11 символов.
const plural = new Intl.PluralRules("ru");
const genitive = (count: number | bigint, one: string, other: string) =>
  `${count} ${plural.select(Number(count)) === "one" ? one : other}`;
const chars = (n: number | bigint) => genitive(n, "символа", "символов");
const items = (n: number | bigint) => genitive(n, "элемента", "элементов");

// Свои формулировки для частых ошибок; остальное — из русской локали zod.
// Сообщения, заданные в схеме явно (.min(1, "Укажите название")), важнее этих.
z.config(z.locales.ru());
z.config({
  customError: (issue) => {
    if (issue.code === "too_big" || issue.code === "too_small") {
      const big = issue.code === "too_big";
      const limit = issue.code === "too_big" ? issue.maximum : issue.minimum;
      if (typeof limit !== "number" && typeof limit !== "bigint") return undefined;
      switch (issue.origin) {
        case "string":
          return big ? `Не длиннее ${chars(limit)}` : `Не короче ${chars(limit)}`;
        case "number":
        case "int":
        case "bigint":
          // inclusive: false — строгая граница, как у positive() и lt().
          if (big) return issue.inclusive ? `Не больше ${limit}` : `Меньше ${limit}`;
          return issue.inclusive ? `Не меньше ${limit}` : `Больше ${limit}`;
        case "array":
        case "set":
          return big ? `Не больше ${items(limit)}` : `Не меньше ${items(limit)}`;
      }
    }
    if (issue.code === "invalid_type" && issue.input === undefined) {
      return "Обязательное поле";
    }
    return undefined;
  },
});

export { z };

// Необязательная строка: пробелы по краям обрезаются, пустая превращается в null.
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable()
    .default(null);
