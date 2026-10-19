"use server";

import { z } from "zod";
import { db } from "@/db";
import { runAction } from "@/server/action";
import type { PageInput } from "@/server/pages/schema";
import {
  createPage as createPageRecord,
  deletePage as deletePageRecord,
  reorderPages as reorderPageRecords,
  updatePage as updatePageRecord,
} from "@/server/pages/service";

const pageId = z.number().int().positive();

export async function createPage(input: PageInput) {
  return runAction("edit_pages", async () => {
    const page = await createPageRecord(db(), input);
    return { id: page.id };
  });
}

export async function updatePage(id: number, input: PageInput) {
  return runAction("edit_pages", async () => {
    await updatePageRecord(db(), pageId.parse(id), input);
  });
}

export async function deletePage(id: number) {
  return runAction("edit_pages", () => deletePageRecord(db(), pageId.parse(id)));
}

export async function reorderPages(parentId: number | null, orderedIds: number[]) {
  return runAction("edit_pages", () =>
    reorderPageRecords(db(), pageId.nullable().parse(parentId), z.array(pageId).parse(orderedIds)),
  );
}
