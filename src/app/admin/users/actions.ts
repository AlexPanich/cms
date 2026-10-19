"use server";

import { z } from "zod";
import { db } from "@/db";
import { runAction } from "@/server/action";
import type { NewUserInput, PasswordInput, UserInput } from "@/server/users/schema";
import {
  createUserWithPassword,
  deleteUser as deleteUserRecord,
  setUserPassword,
  updateUser as updateUserRecord,
} from "@/server/users/service";

// Аргументы server action приходят от клиента: id проверяем здесь, остальное — схемы сервиса.
const userId = z.string().min(1);

export async function createUser(input: NewUserInput) {
  return runAction("edit_users", () => createUserWithPassword(db(), input));
}

export async function updateUser(id: string, input: UserInput) {
  return runAction("edit_users", () => updateUserRecord(db(), userId.parse(id), input));
}

export async function changePassword(id: string, input: PasswordInput) {
  return runAction("edit_users", (actor) =>
    setUserPassword(db(), userId.parse(id), input, {
      keepSessionId: actor.id === id ? actor.sessionId : undefined,
    }),
  );
}

export async function deleteUser(id: string) {
  return runAction("edit_users", (actor) => deleteUserRecord(db(), userId.parse(id), actor.id));
}
