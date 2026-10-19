import type { Metadata } from "next";
import { PERMISSION_LABELS, PERMISSIONS } from "@/lib/permissions";
import { requirePagePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Админка" };

export default async function AdminPage() {
  const user = await requirePagePermission("view_admin");
  const granted = PERMISSIONS.filter((permission) => user.permissions.has(permission));

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Здравствуйте, {user.name}</h1>
      <p className="text-foreground/70">Разделы админки появятся на этапе 4. Ваши права:</p>
      <ul className="list-disc pl-5">
        {granted.map((permission) => (
          <li key={permission}>{PERMISSION_LABELS[permission]}</li>
        ))}
      </ul>
    </div>
  );
}
