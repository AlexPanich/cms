import { describe, expect, it } from "vitest";
import { texts } from "@/db/schema";
import { withRollback as withRollbackBase } from "@/test/db";
import type { Tx } from "@/db";
import type { TextInput } from "./schema";
import {
  createText,
  deleteText,
  listTexts,
  TextError,
  type TextErrorCode,
  updateText,
} from "./service";

// Тесты сравнивают списки, поэтому начинают с пустой таблицы.
const withRollback = (fn: (tx: Tx) => Promise<void>) => withRollbackBase(fn, { clear: [texts] });

const input = (key: string, extra: Partial<TextInput> = {}): TextInput => ({
  key,
  title: key,
  ...extra,
});

async function expectTextError(promise: Promise<unknown>, code: TextErrorCode) {
  await expect(promise).rejects.toSatisfy(
    (error) => error instanceof TextError && error.code === code,
  );
}

describe("texts service", () => {
  it("создаёт текст с обрезкой пробелов и значениями по умолчанию", () =>
    withRollback(async (tx) => {
      const text = await createText(tx, input("site-title", { body: "  Моя компания \n" }));
      expect(text).toMatchObject({ key: "site-title", body: "Моя компания", published: true });
    }));

  it("не даёт занять чужой ключ ни при создании, ни при правке", () =>
    withRollback(async (tx) => {
      await createText(tx, input("phone"));
      const email = await createText(tx, input("email"));
      await expectTextError(createText(tx, input("phone")), "key_taken");
      await expectTextError(updateText(tx, email.id, input("phone")), "key_taken");
    }));

  it("отклоняет ключ не в формате slug — и схемой, и ограничением БД", () =>
    withRollback(async (tx) => {
      await expect(createText(tx, input("Site Title"))).rejects.toThrow();
      await expect(tx.insert(texts).values({ key: "Bad Key", title: "x" })).rejects.toThrow();
    }));

  it("ищет по названию, ключу и тексту", () =>
    withRollback(async (tx) => {
      await createText(tx, input("phone", { title: "Телефон", body: "+7 900 000-00-00" }));
      await createText(tx, input("address", { title: "Адрес", body: "Москва, 100%" }));

      const keys = async (search: string) =>
        (await listTexts(tx, { page: 1, search })).items.map((item) => item.key);
      expect(await keys("телеф")).toEqual(["phone"]);
      expect(await keys("addr")).toEqual(["address"]);
      expect(await keys("100%")).toEqual(["address"]);
      expect(await keys("%")).toEqual(["address"]);
      expect((await listTexts(tx, { page: 1, search: "" })).total).toBe(2);
    }));

  it("правит и удаляет, сообщает об отсутствующем тексте", () =>
    withRollback(async (tx) => {
      const text = await createText(tx, input("slogan"));
      const updated = await updateText(tx, text.id, input("slogan", { published: false }));
      expect(updated.published).toBe(false);

      await deleteText(tx, text.id);
      await expectTextError(deleteText(tx, text.id), "text_not_found");
      await expectTextError(updateText(tx, text.id, input("slogan")), "text_not_found");
    }));
});
