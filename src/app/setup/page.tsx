import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { hasUsers } from "@/server/setup/service";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "Первый запуск", robots: { index: false } };

// Первый запуск: пока в базе нет пользователей, здесь создаётся администратор.
export default function SetupPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-semibold">Первый запуск</h1>
        <p className="text-foreground/70 mb-6 text-sm">
          В системе ещё нет пользователей. Создайте администратора — дальше пользователей добавляют
          в админке.
        </p>
        <Suspense>
          <Setup />
        </Suspense>
      </div>
    </main>
  );
}

async function Setup() {
  await connection();
  if (await hasUsers(db())) redirect("/login");
  return <SetupForm />;
}
