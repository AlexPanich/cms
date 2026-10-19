"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

// Кнопка с подтверждением для необратимых действий (удаление и т. п.).
// action — server action с уже привязанными аргументами: deleteUser.bind(null, id).
export function ConfirmAction({
  action,
  title,
  description,
  confirmLabel = "Удалить",
  successMessage,
  redirectTo,
  children,
  ...buttonProps
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "children"> & {
  action: () => Promise<ActionResult<unknown>>;
  title: string;
  description: string;
  confirmLabel?: string;
  successMessage: string;
  redirectTo?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button {...buttonProps} />}>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Отмена</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={confirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
