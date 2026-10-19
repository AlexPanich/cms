import { describe, expect, it } from "vitest";
import { users } from "@/db/schema";
import { ADMIN_ROLE } from "@/lib/permissions";
import { getUser } from "@/server/users/service";
import { withRollback } from "@/test/db";
import { createFirstAdmin, hasUsers, SetupError } from "./service";

const INPUT = { name: "Анна", email: "anna@example.com", password: "correct horse battery" };

describe("createFirstAdmin", () => {
  it("создаёт администратора, пока пользователей нет", () =>
    withRollback(
      async (tx) => {
        expect(await hasUsers(tx)).toBe(false);
        const { id } = await createFirstAdmin(tx, INPUT);
        expect(await getUser(tx, id)).toMatchObject({
          email: "anna@example.com",
          roleKeys: [ADMIN_ROLE],
        });
        expect(await hasUsers(tx)).toBe(true);
      },
      { clear: [users] },
    ));

  it("отказывает, если пользователь уже есть", () =>
    withRollback(
      async (tx) => {
        await createFirstAdmin(tx, INPUT);
        await expect(
          createFirstAdmin(tx, { ...INPUT, email: "boris@example.com" }),
        ).rejects.toSatisfy(
          (error) => error instanceof SetupError && error.code === "already_done",
        );
      },
      { clear: [users] },
    ));

  it("не принимает роль из ввода и проверяет пароль", () =>
    withRollback(
      async (tx) => {
        await expect(createFirstAdmin(tx, { ...INPUT, password: "short" })).rejects.toThrow();
        expect(await hasUsers(tx)).toBe(false);
      },
      { clear: [users] },
    ));
});
