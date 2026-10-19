import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/db";
import { requirePagePermission } from "@/server/auth/session";
import { listRoles } from "@/server/roles/service";
import { CreateUserForm } from "../_components/user-forms";

export const metadata: Metadata = { title: "Новый пользователь" };

export default async function NewUserPage() {
  await requirePagePermission("edit_users", "/admin/users/new");
  const roles = await listRoles(db());

  return (
    <>
      <PageHeader title="Новый пользователь" />
      <CreateUserForm roles={roles.map((role) => ({ value: role.key, label: role.name }))} />
    </>
  );
}
