"use client";

import { createContext, type ReactNode, use, useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import type { GalleryOption } from "../gallery-node";
import type { UploadedImage } from "../image-upload";

// Данные для полей блока: галереи для rich text и полей-галерей, страницы для ссылок,
// документы, адреса картинок для превью и загрузка новой картинки. Одни и те же поля работают в админке и на сайте —
// отличаются только данные и server action загрузки (у них разные права).

export type PageOption = { id: number; title: string; depth: number };

export type DocumentOption = { id: number; title: string };

type BlockEditorData = {
  galleries: GalleryOption[];
  pages: PageOption[];
  documents: DocumentOption[];
  imageUrl: (mediaId: number) => string | undefined;
  upload: (formData: FormData) => Promise<ActionResult<UploadedImage>>;
  rememberImage: (image: UploadedImage) => void;
};

const BlockEditorContext = createContext<BlockEditorData | null>(null);

export function BlockEditorProvider({
  galleries,
  pages,
  documents,
  images,
  upload,
  children,
}: {
  galleries: GalleryOption[];
  pages: PageOption[];
  documents: DocumentOption[];
  // Адреса картинок, которые уже есть в блоках: mediaId → url.
  images: Record<number, string>;
  upload: (formData: FormData) => Promise<ActionResult<UploadedImage>>;
  children: ReactNode;
}) {
  const [uploaded, setUploaded] = useState<Record<number, string>>({});
  return (
    <BlockEditorContext
      value={{
        galleries,
        pages,
        documents,
        imageUrl: (mediaId) => uploaded[mediaId] ?? images[mediaId],
        upload,
        rememberImage: (image) => setUploaded((current) => ({ ...current, [image.id]: image.url })),
      }}
    >
      {children}
    </BlockEditorContext>
  );
}

export function useBlockEditor(): BlockEditorData {
  const data = use(BlockEditorContext);
  if (!data) throw new Error("Поля блока выводятся только внутри BlockEditorProvider");
  return data;
}
