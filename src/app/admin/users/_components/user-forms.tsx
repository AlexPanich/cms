"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "@/lib/zod";
import { FormCheckboxGroup, FormInput } from "@/components/admin/form-fields";
import { useActionSubmit } from "@/components/admin/use-action-submit";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { newUserSchema, passwordSchema, userInputSchema } from "@/server/users/schema";
import { changePassword, createUser, updateUser } from "../actions";

export type RoleOption = { value: string; label: string; description?: string };

const passwordHint = `Не короче ${MIN_PASSWORD_LENGTH} символов`;

export function CreateUserForm({ roles }: { roles: RoleOption[] }) {
  const router = useRouter();
  const form = useForm<z.input<typeof newUserSchema>, unknown, z.output<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { name: "", email: "", password: "", roleKeys: [] },
  });
  const { onSubmit, pending } = useActionSubmit(form, createUser, {
    successMessage: "Пользователь создан",
    // Next 16 сохраняет состояние посещённых страниц (React Activity) — без reset при
    // следующем открытии «Нового пользователя» в форме остались бы прежние значения.
    onSuccess: () => {
      form.reset();
      router.push("/admin/users");
    },
  });

  return (
    <form onSubmit={onSubmit} className="max-w-lg">
      <FieldGroup>
        <FormInput control={form.control} name="name" label="Имя" autoComplete="off" />
        <FormInput
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="off"
        />
        <FormInput
          control={form.control}
          name="password"
          label="Пароль"
          type="password"
          autoComplete="new-password"
          description={passwordHint}
        />
        <FormCheckboxGroup control={form.control} name="roleKeys" label="Роли" options={roles} />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Создаём…" : "Создать пользователя"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

export function EditUserForm({
  user,
  roles,
}: {
  user: { id: string; name: string; email: string; roleKeys: string[] };
  roles: RoleOption[];
}) {
  const router = useRouter();
  const form = useForm<z.input<typeof userInputSchema>, unknown, z.output<typeof userInputSchema>>({
    resolver: zodResolver(userInputSchema),
    defaultValues: { name: user.name, email: user.email, roleKeys: user.roleKeys },
  });
  const { onSubmit, pending } = useActionSubmit(form, (values) => updateUser(user.id, values), {
    successMessage: "Изменения сохранены",
    onSuccess: () => router.refresh(),
  });

  return (
    <form onSubmit={onSubmit} className="max-w-lg">
      <FieldGroup>
        <FormInput control={form.control} name="name" label="Имя" autoComplete="off" />
        <FormInput
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="off"
        />
        <FormCheckboxGroup control={form.control} name="roleKeys" label="Роли" options={roles} />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Сохраняем…" : "Сохранить"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

export function PasswordForm({ userId }: { userId: string }) {
  const form = useForm<z.input<typeof passwordSchema>, unknown, z.output<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });
  const { onSubmit, pending } = useActionSubmit(form, (values) => changePassword(userId, values), {
    successMessage: "Пароль изменён, другие сеансы пользователя завершены",
    onSuccess: () => form.reset(),
  });

  return (
    <form onSubmit={onSubmit} className="max-w-lg">
      <FieldGroup>
        <FormInput
          control={form.control}
          name="password"
          label="Новый пароль"
          type="password"
          autoComplete="new-password"
          description={passwordHint}
        />
        <div>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Меняем…" : "Сменить пароль"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
