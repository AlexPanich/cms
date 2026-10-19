"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { authClient } from "@/lib/auth-client";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
import { setupAdmin } from "./actions";

type State = { error: string | null; name: string; email: string };

const inputClass = "border-foreground/20 rounded-md border bg-transparent px-3 py-2";

export function SetupForm() {
  const router = useRouter();

  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      const name = String(formData.get("name") ?? "");
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      if (password !== formData.get("confirm")) {
        return { name, email, error: "Пароли не совпадают" };
      }

      const result = await setupAdmin({ name, email, password });
      if (!result.ok) {
        const fieldError = Object.values(result.fieldErrors ?? {}).find(Boolean)?.[0];
        return { name, email, error: fieldError ?? result.error };
      }

      // Администратор создан — сразу входим. Если вход не удался, пусть войдёт сам.
      const { error } = await authClient.signIn.email({ email, password });
      router.replace(error ? "/login" : "/admin");
      router.refresh();
      return { name, email, error: null };
    },
    { error: null, name: "Администратор", email: "" },
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Имя
        <input
          name="name"
          autoComplete="name"
          required
          defaultValue={state.name}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className={inputClass}
        />
      </label>
      <div className="flex flex-col gap-1">
        <label className="flex flex-col gap-1 text-sm">
          Пароль
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            aria-describedby="setup-password-hint"
            className={inputClass}
          />
        </label>
        <p id="setup-password-hint" className="text-foreground/60 text-xs">
          Не короче {MIN_PASSWORD_LENGTH} символов
        </p>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Пароль ещё раз
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
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
        {pending ? "Создаём…" : "Создать администратора"}
      </button>
    </form>
  );
}
