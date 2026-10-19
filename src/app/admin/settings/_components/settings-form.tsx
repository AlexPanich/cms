"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type Control, type FieldValues, useForm } from "react-hook-form";
import type { z } from "@/lib/zod";
import { BlockFields } from "@/components/admin/blocks/block-fields";
import {
  BlockEditorProvider,
  type DocumentOption,
  type PageOption,
} from "@/components/admin/blocks/editor-context";
import type { GalleryOption } from "@/components/admin/gallery-node";
import { useActionSubmit } from "@/components/admin/use-action-submit";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { SITE_SETTINGS, type SiteSettings } from "@/lib/site-settings";
import { siteSettingsSchema } from "@/server/settings/schema";
import { updateSiteSettings, uploadSettingsImage } from "../actions";

// Форма строится по полям настроек (ядро и тема), как форма блока.
export function SettingsForm({
  settings,
  galleries,
  pages,
  documents,
  images,
}: {
  settings: SiteSettings;
  galleries: GalleryOption[];
  pages: PageOption[];
  documents: DocumentOption[];
  images: Record<number, string>;
}) {
  const router = useRouter();
  const form = useForm<
    z.input<typeof siteSettingsSchema>,
    unknown,
    z.output<typeof siteSettingsSchema>
  >({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: settings,
  });
  const { onSubmit, pending } = useActionSubmit(form, updateSiteSettings, {
    successMessage: "Настройки сохранены",
    onSuccess: () => router.refresh(),
  });

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <FieldGroup>
        <BlockEditorProvider
          galleries={galleries}
          pages={pages}
          documents={documents}
          images={images}
          upload={uploadSettingsImage}
        >
          <BlockFields
            control={form.control as unknown as Control<FieldValues>}
            fields={SITE_SETTINGS}
          />
        </BlockEditorProvider>
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Сохраняем…" : "Сохранить"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
