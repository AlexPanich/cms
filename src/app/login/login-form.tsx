"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { authClient } from "@/lib/auth-client";

type State = { error: string | null; email: string };

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();

  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");

      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        return {
          email,
          error:
            error.status === 429
              ? "Слишком много попыток. Подождите минуту и попробуйте снова"
              : "Неверный email или пароль",
        };
      }

      router.replace(next);
      router.refresh();
      return { email, error: null };
    },
    { error: null, email: "" },
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className="border-foreground/20 rounded-md border bg-transparent px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Пароль
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="border-foreground/20 rounded-md border bg-transparent px-3 py-2"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background rounded-md px-3 py-2 disabled:opacity-60"
      >
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
