"use client";

import {
  mergeAttributes,
  Node,
  NodeViewWrapper,
  type ReactNodeViewProps,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { ImagesIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GALLERY_NODE } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

export type GalleryOption = { key: string; title: string };

type GalleryNodeOptions = { galleries: GalleryOption[] };

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    gallery: { insertGallery: (key: string) => ReturnType };
  }
}

// Галерея в тексте — отдельный блок со ссылкой на галерею по ключу. На сайте на его месте
// выводятся картинки (src/components/site/rich-text.tsx), в редакторе — плашка с названием.
export const GalleryNode = Node.create<GalleryNodeOptions>({
  name: GALLERY_NODE,
  group: "block",
  atom: true,
  draggable: true,

  addOptions: () => ({ galleries: [] }),

  addAttributes: () => ({
    key: {
      default: null,
      parseHTML: (element) => element.getAttribute("data-gallery"),
      renderHTML: (attributes) => ({ "data-gallery": attributes.key }),
    },
  }),

  parseHTML: () => [{ tag: "div[data-gallery]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", mergeAttributes(HTMLAttributes)],

  addNodeView() {
    return ReactNodeViewRenderer(GalleryNodeView);
  },

  addCommands() {
    return {
      insertGallery:
        (key) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { key } }),
    };
  },
});

function GalleryNodeView({ node, extension, selected, deleteNode }: ReactNodeViewProps) {
  const key = String(node.attrs.key ?? "");
  const { galleries } = extension.options as GalleryNodeOptions;
  const gallery = galleries.find((option) => option.key === key);
  const label = gallery ? `Галерея «${gallery.title}»` : `Галерея «${key}» не найдена`;

  return (
    <NodeViewWrapper
      data-drag-handle
      className={cn(
        "not-prose bg-muted/50 my-2 flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        selected && "ring-ring ring-2",
        !gallery && "border-destructive text-destructive",
      )}
    >
      <ImagesIcon className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">{label}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Убрать: ${label}`}
        onClick={deleteNode}
      >
        <XIcon />
      </Button>
    </NodeViewWrapper>
  );
}
