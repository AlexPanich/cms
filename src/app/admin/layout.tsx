import { Suspense } from "react";
import { requirePagePermission } from "@/server/auth/session";
import { logout } from "./actions";

// Layout не перерисовывается при переходах между дочерними страницами, поэтому проверка
// здесь — только для оболочки. Каждая страница и server action проверяют своё право сами.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<p className="p-4 text-sm">Загрузка…</p>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await requirePagePermission("view_admin");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-foreground/10 flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">CMS</span>
        <div className="flex items-center gap-4 text-sm">
          <span>{user.name}</span>
          <form action={logout}>
            <button type="submit" className="underline underline-offset-4">
              Выйти
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
