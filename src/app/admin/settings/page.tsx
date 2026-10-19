import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/db";
import { type Field, fieldReferences, walkFields } from "@/lib/blocks/define";
import { hasFieldKind } from "@/lib/blocks/form";
import { SITE_SETTINGS } from "@/lib/site-settings";
import { requirePagePermission } from "@/server/auth/session";
import { listDocumentOptions } from "@/server/documents/service";
import { listGalleryOptions } from "@/server/galleries/service";
import { listImageUrls } from "@/server/media/service";
import { getPageTree } from "@/server/pages/service";
import { flattenTree } from "@/server/pages/tree";
import { getSiteSettings } from "@/server/settings/service";
import { SettingsForm } from "./_components/settings-form";

export const metadata: Metadata = { title: "Настройки сайта" };

export default async function SettingsPage() {
  await requirePagePermission("edit_settings", "/admin/settings");

  // Списки для полей — только если такие поля есть у настроек (их может добавить тема).
  const settings = await getSiteSettings(db());
  const needs = (kind: Field["kind"]) => hasFieldKind(SITE_SETTINGS, kind);
  const [galleries, tree, documents, images] = await Promise.all([
    needs("richText") || needs("gallery") ? listGalleryOptions(db()) : [],
    needs("link") ? getPageTree(db()) : [],
    needs("document") ? listDocumentOptions(db()) : [],
    listImageUrls(db(), fieldReferences(walkFields(SITE_SETTINGS, settings)).imageIds),
  ]);

  return (
    <>
      <PageHeader
        title="Настройки сайта"
        description="Логотип, контакты и соцсети: их выводят шапка, подвал и блок «Контакты»"
      />
      <SettingsForm
        settings={settings}
        galleries={galleries}
        pages={flattenTree(tree).map(({ id, title, depth }) => ({ id, title, depth }))}
        documents={documents}
        images={images}
      />
    </>
  );
}
