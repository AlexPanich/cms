"use server";

import { db } from "@/db";
import { runAction } from "@/server/action";
import type { FrontEditInput } from "@/server/front-edit/schema";
import { saveFrontEdit as saveFrontEditRecord } from "@/server/front-edit/service";

// Правка на сайте. Какие поля можно менять — решает схема сервиса, а не клиент.
export async function saveFrontEdit(input: FrontEditInput) {
  return runAction("edit_from_front", () => saveFrontEditRecord(db(), input));
}
