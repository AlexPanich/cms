"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "@/lib/zod";
import { FormCheckboxGroup, FormInput } from "@/components/admin/form-fields";
import { useActionSubmit } from "@/components/admin/use-action-submit";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import { PERMISSION_LABELS, PERMISSIONS } from "@/lib/permissions";
import { slugify } from "@/lib/slug";
import { roleInputSchema } from "@/server/roles/schema";
import { createRole, updateRole } from "../actions";

const permissionOptions = PERMISSIONS.map((permission) => ({
  value: permission,
  label: PERMISSION_LABELS[permission],
}));

type RoleFormProps = {
  role?: {
    id: number;
    key: string;
    name: string;
    permissions: (typeof PERMISSIONS)[number][];
    isSystem: boolean;
    isAdmin: boolean;
  };
};

export function RoleForm({ role }: RoleFormProps) {
  const router = useRouter();
  const form = useForm<z.input<typeof roleInputSchema>, unknown, z.output<typeof roleInputSchema>>({
    resolver: zodResolver(roleInputSchema),
    defaultValues: {
      key: role?.key ?? "",
      name: role?.name ?? "",
      permissions: role?.permissions ?? ["view_admin"],
    },
  });

  const { onSubmit, pending } = useActionSubmit(
    form,
    (values): Promise<ActionResult<unknown>> =>
      role ? updateRole(role.id, values) : createRole(values),
    {
      successMessage: role ? "Роль сохранена" : "Роль создана",
      onSuccess: () => {
        if (role) return router.refresh();
        form.reset(); // см. CreateUserForm: состояние страницы создания сохраняется между визитами
        router.push("/admin/roles");
      },
    },
  );

  // Для новой роли предлагаем ключ из названия, пока его не заполнили вручную.
  const suggestKey = () => {
    if (!role && !form.getValues("key")) {
      form.setValue("key", slugify(form.getValues("name")), { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-lg">
      <FieldGroup>
        <FormInput
          control={form.control}
          name="name"
          label="Название"
          autoComplete="off"
          onBlur={suggestKey}
        />
        <FormInput
          control={form.control}
          name="key"
          label="Ключ"
          autoComplete="off"
          disabled={role?.isSystem}
          description={
            role?.isSystem
              ? "Ключ системной роли изменить нельзя"
              : "Латиница, цифры и дефисы. Используется в коде и сидах"
          }
        />
        <FormCheckboxGroup
          control={form.control}
          name="permissions"
          label="Права"
          description={role?.isAdmin ? "У администратора всегда все права" : undefined}
          options={permissionOptions}
          disabled={role?.isAdmin}
        />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Сохраняем…" : role ? "Сохранить" : "Создать роль"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
