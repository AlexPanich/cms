"use server";

import { z } from "@/lib/zod";
import { db } from "@/db";
import { runAction } from "@/server/action";
import type { RoleInput } from "@/server/roles/schema";
import {
  createRole as createRoleRecord,
  deleteRole as deleteRoleRecord,
  updateRole as updateRoleRecord,
} from "@/server/roles/service";

const roleId = z.number().int().positive();

export async function createRole(input: RoleInput) {
  return runAction("edit_roles", () => createRoleRecord(db(), input));
}

export async function updateRole(id: number, input: RoleInput) {
  return runAction("edit_roles", () => updateRoleRecord(db(), roleId.parse(id), input));
}

export async function deleteRole(id: number) {
  return runAction("edit_roles", () => deleteRoleRecord(db(), roleId.parse(id)));
}
