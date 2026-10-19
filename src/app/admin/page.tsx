import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/permissions";
import { requirePagePermission } from "@/server/auth/session";
import { ADMIN_NAV } from "./_components/nav";

export default async function AdminPage() {
  const user = await requirePagePermission("view_admin");
  const sections = ADMIN_NAV.filter((item) => item.href !== "/admin" && can(user, item.permission));

  return (
    <>
      <PageHeader title={`Здравствуйте, ${user.name}`} description="Выберите раздел для работы" />
      {sections.length === 0 ? (
        <p className="text-muted-foreground">
          Разделов, доступных для вашей роли, пока нет. Обратитесь к администратору.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <Card className="group-hover:bg-muted/50 transition-colors">
                <CardHeader>
                  <item.icon className="text-muted-foreground mb-2 size-5" />
                  <CardTitle>{item.label}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
