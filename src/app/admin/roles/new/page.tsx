import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { requirePagePermission } from "@/server/auth/session";
import { RoleForm } from "../_components/role-form";

export const metadata: Metadata = { title: "Новая роль" };

export default async function NewRolePage() {
  await requirePagePermission("edit_roles", "/admin/roles/new");

  return (
    <>
      <PageHeader title="Новая роль" />
      <RoleForm />
    </>
  );
}
