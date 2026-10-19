import { z } from "@/lib/zod";
import { isSafeLinkUrl } from "@/lib/url";

const MENU_ITEM_KINDS = ["page", "url"] as const;

// Плоская форма удобнее для react-hook-form: при смене вида пункта значения других полей
// не теряются. Эту схему использует форма, сервис — menuItemInputSchema.
export const menuItemFormSchema = z
  .object({
    kind: z.enum(MENU_ITEM_KINDS),
    pageId: z.number().int().positive().nullable().default(null),
    url: z.string().trim().max(2000).default(""),
    label: z.string().trim().max(100).default(""),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "page" && value.pageId === null) {
      ctx.addIssue({ code: "custom", path: ["pageId"], message: "Выберите страницу" });
    }
    if (value.kind === "url") {
      if (!isSafeLinkUrl(value.url)) {
        ctx.addIssue({
          code: "custom",
          path: ["url"],
          message: "Ссылка должна начинаться с «/», http://, https://, mailto: или tel:",
        });
      }
      if (!value.label) {
        ctx.addIssue({ code: "custom", path: ["label"], message: "Укажите название ссылки" });
      }
    }
  });

// На выходе — ровно то, что хранится в menu_items.
export const menuItemInputSchema = menuItemFormSchema.transform((value) =>
  value.kind === "page"
    ? { pageId: value.pageId, url: null, label: value.label || null }
    : { pageId: null, url: value.url, label: value.label },
);

export type MenuItemInput = z.input<typeof menuItemInputSchema>;
