"use server";

import { z } from "zod";
import { db } from "@/db";
import { runAction } from "@/server/action";
import type { MenuItemInput } from "@/server/menus/schema";
import {
  createMenuItem as createMenuItemRecord,
  deleteMenuItem as deleteMenuItemRecord,
  reorderMenuItems as reorderMenuItemRecords,
  updateMenuItem as updateMenuItemRecord,
} from "@/server/menus/service";

const recordId = z.number().int().positive();

export async function createMenuItem(menuId: number, input: MenuItemInput) {
  return runAction("edit_menus", async () => {
    const item = await createMenuItemRecord(db(), recordId.parse(menuId), input);
    return { id: item.id };
  });
}

export async function updateMenuItem(id: number, input: MenuItemInput) {
  return runAction("edit_menus", async () => {
    await updateMenuItemRecord(db(), recordId.parse(id), input);
  });
}

export async function deleteMenuItem(id: number) {
  return runAction("edit_menus", () => deleteMenuItemRecord(db(), recordId.parse(id)));
}

export async function reorderMenuItems(menuId: number, orderedIds: number[]) {
  return runAction("edit_menus", () =>
    reorderMenuItemRecords(db(), recordId.parse(menuId), z.array(recordId).parse(orderedIds)),
  );
}
