import { Trash2Icon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PageHeader } from "@/components/admin/page-header";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { requirePagePermission } from "@/server/auth/session";
import { listRoles } from "@/server/roles/service";
import { getUser } from "@/server/users/service";
import { EditUserForm, PasswordForm } from "../_components/user-forms";
import { deleteUser } from "../actions";

export const metadata: Metadata = { title: "Пользователь" };

export default async function UserPage({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  const actor = await requirePagePermission("edit_users", `/admin/users/${id}`);
  const [user, roles] = await Promise.all([getUser(db(), id), listRoles(db())]);
  if (!user) notFound();

  const isSelf = actor.id === user.id;

  return (
    <>
      <PageHeader title={user.name} description={user.email}>
        {!isSelf && (
          <ConfirmAction
            action={deleteUser.bind(null, user.id)}
            title="Удалить пользователя?"
            description={`${user.name} (${user.email}) больше не сможет войти. Действие нельзя отменить.`}
            successMessage="Пользователь удалён"
            redirectTo="/admin/users"
            variant="outline"
          >
            <Trash2Icon />
            Удалить
          </ConfirmAction>
        )}
      </PageHeader>

      <EditUserForm
        user={user}
        roles={roles.map((role) => ({ value: role.key, label: role.name }))}
      />

      <Separator className="my-8 max-w-lg" />

      <h2 className="mb-4 text-lg font-semibold">Пароль</h2>
      <PasswordForm userId={user.id} />
    </>
  );
}
