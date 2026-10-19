import { Trash2Icon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/db";
import { ADMIN_ROLE } from "@/lib/permissions";
import { requirePagePermission } from "@/server/auth/session";
import { getRole } from "@/server/roles/service";
import { RoleForm } from "../_components/role-form";
import { deleteRole } from "../actions";

export const metadata: Metadata = { title: "Роль" };

export default async function RolePage({ params }: PageProps<"/admin/roles/[id]">) {
  const { id } = await params;
  await requirePagePermission("edit_roles", `/admin/roles/${id}`);

  const roleId = Number(id);
  const role = Number.isSafeInteger(roleId) && roleId > 0 ? await getRole(db(), roleId) : null;
  if (!role) notFound();

  return (
    <>
      <PageHeader
        title={role.name}
        description={role.isSystem ? "Системная роль: её нельзя удалить" : undefined}
      >
        {!role.isSystem && (
          <ConfirmAction
            action={deleteRole.bind(null, role.id)}
            title="Удалить роль?"
            description={
              role.userCount > 0
                ? `Роль снимется с пользователей (${role.userCount}), и они потеряют её права.`
                : "Действие нельзя отменить."
            }
            successMessage="Роль удалена"
            redirectTo="/admin/roles"
            variant="outline"
          >
            <Trash2Icon />
            Удалить
          </ConfirmAction>
        )}
      </PageHeader>

      <RoleForm role={{ ...role, isAdmin: role.isSystem && role.key === ADMIN_ROLE }} />
    </>
  );
}
