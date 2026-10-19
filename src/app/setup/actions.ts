"use server";

import { db } from "@/db";
import type { ActionResult } from "@/lib/action-result";
import { actionFailure } from "@/server/action";
import type { SetupInput } from "@/server/setup/schema";
import { createFirstAdmin } from "@/server/setup/service";

// Без проверки права: пользователей ещё нет. Сервис сам откажет, если они появились.
export async function setupAdmin(input: SetupInput): Promise<ActionResult> {
  try {
    await createFirstAdmin(db(), input);
    return { ok: true, data: undefined };
  } catch (error) {
    return actionFailure(error);
  }
}
