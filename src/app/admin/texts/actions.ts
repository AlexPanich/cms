"use server";

import { z } from "zod";
import { db } from "@/db";
import { runAction } from "@/server/action";
import type { TextInput } from "@/server/texts/schema";
import {
  createText as createTextRecord,
  deleteText as deleteTextRecord,
  updateText as updateTextRecord,
} from "@/server/texts/service";

const textId = z.number().int().positive();

export async function createText(input: TextInput) {
  return runAction("edit_texts", async () => {
    const text = await createTextRecord(db(), input);
    return { id: text.id };
  });
}

export async function updateText(id: number, input: TextInput) {
  return runAction("edit_texts", async () => {
    await updateTextRecord(db(), textId.parse(id), input);
  });
}

export async function deleteText(id: number) {
  return runAction("edit_texts", () => deleteTextRecord(db(), textId.parse(id)));
}
