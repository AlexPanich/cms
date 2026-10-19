import { describe, expect, it } from "vitest";
import { z } from "./zod";

const message = (schema: z.ZodType, value: unknown) =>
  schema.safeParse(value).error?.issues[0]?.message;

describe("сообщения zod на русском", () => {
  it("длина строки с правильным склонением", () => {
    expect(message(z.string().max(50), "x".repeat(51))).toBe("Не длиннее 50 символов");
    expect(message(z.string().max(1), "xx")).toBe("Не длиннее 1 символа");
    expect(message(z.string().max(21), "x".repeat(22))).toBe("Не длиннее 21 символа");
    expect(message(z.string().min(3), "x")).toBe("Не короче 3 символов");
  });

  it("числа, списки и обязательные поля", () => {
    expect(message(z.number().max(10), 11)).toBe("Не больше 10");
    expect(message(z.number().int().positive(), 0)).toBe("Больше 0");
    expect(message(z.number().min(1), 0)).toBe("Не меньше 1");
    expect(message(z.array(z.string()).max(2), ["a", "b", "c"])).toBe("Не больше 2 элементов");
    expect(message(z.array(z.string()).min(1), [])).toBe("Не меньше 1 элемента");
    expect(message(z.object({ a: z.string() }), {})).toBe("Обязательное поле");
  });

  it("остальное — из русской локали, явное сообщение схемы важнее", () => {
    expect(message(z.email(), "x")).toBe("Неверный email адрес");
    expect(message(z.string().min(1, "Укажите название"), "")).toBe("Укажите название");
  });
});
