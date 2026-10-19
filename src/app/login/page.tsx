import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/db";
import { safeRedirectPath } from "@/lib/redirect";
import { getCurrentUser } from "@/server/auth/session";
import { hasUsers } from "@/server/setup/service";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-semibold">Вход</h1>
        <Suspense>
          <Login searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next } = await searchParams;
  const target = safeRedirectPath(typeof next === "string" ? next : null);

  if (await getCurrentUser()) redirect(target);
  // Первый запуск: входить некому, сначала создаём администратора.
  if (!(await hasUsers(db()))) redirect("/setup");
  return <LoginForm next={target} />;
}
