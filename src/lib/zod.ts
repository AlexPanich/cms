import { z } from "zod";

// Необязательная строка: пробелы по краям обрезаются, пустая превращается в null.
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable()
    .default(null);
