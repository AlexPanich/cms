"use client";

import { useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

// Отправка формы react-hook-form в server action: ошибки полей с сервера попадают в форму,
// общая ошибка и успех показываются уведомлением.
export function useActionSubmit<TInput extends FieldValues, TOutput, TResult>(
  form: UseFormReturn<TInput, unknown, TOutput>,
  action: (values: TOutput) => Promise<ActionResult<TResult>>,
  options: { successMessage?: string; onSuccess?: (data: TResult) => void } = {},
) {
  const [pending, startTransition] = useTransition();

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await action(values);
      if (!result.ok) {
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) form.setError(field as Path<TInput>, { message: messages[0] });
        }
        toast.error(result.error);
        return;
      }
      if (options.successMessage) toast.success(options.successMessage);
      options.onSuccess?.(result.data);
    }),
  );

  return { onSubmit, pending };
}
