"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { FormInput } from "@/components/admin/form-fields";
import { useActionSubmit } from "@/components/admin/use-action-submit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { imageInfoSchema } from "@/server/media/schema";
import type { GalleryImage } from "@/server/galleries/service";
import { updateGalleryImageInfo } from "../actions";

type FormValues = z.input<typeof imageInfoSchema>;

// Описание картинки хранится в media, поэтому оно общее для всех мест, где она используется.
export function ImageInfoDialog({ image }: { image: GalleryImage }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues, unknown, z.output<typeof imageInfoSchema>>({
    resolver: zodResolver(imageInfoSchema),
    defaultValues: { alt: image.alt ?? "" },
  });

  const { onSubmit, pending } = useActionSubmit(
    form,
    (values) => updateGalleryImageInfo(image.id, values),
    {
      successMessage: "Описание сохранено",
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    },
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // При открытии — свежее значение: после refresh описание могло измениться.
        if (next) form.reset({ alt: image.alt ?? "" });
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Описание «${image.alt ?? image.originalName}»`}
          />
        }
      >
        <PencilIcon />
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Описание изображения</DialogTitle>
            <DialogDescription>{image.originalName}</DialogDescription>
          </DialogHeader>
          <FormInput
            control={form.control}
            name="alt"
            label="Описание"
            description="Что изображено на картинке. Его читают скринридеры и поисковики"
            autoComplete="off"
          />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Сохраняем…" : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
