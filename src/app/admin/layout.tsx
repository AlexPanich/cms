import type { Metadata } from "next";
import { Suspense } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requirePagePermission } from "@/server/auth/session";
import { AdminSidebar } from "./_components/admin-sidebar";

export const metadata: Metadata = {
  title: { template: "%s · Админка", default: "Админка" },
  robots: { index: false, follow: false },
};

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
    <TooltipProvider>
      <SidebarProvider>
        <AdminSidebar
          user={{ name: user.name, email: user.email }}
          permissions={[...user.permissions]}
        />
        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger />
          </header>
          <div className="flex-1 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      <Toaster richColors position="top-right" containerAriaLabel="Уведомления" />
    </TooltipProvider>
  );
}
