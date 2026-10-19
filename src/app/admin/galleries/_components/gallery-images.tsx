"use client";

import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Button } from "@/components/ui/button";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { GalleryImage } from "@/server/galleries/service";
import { removeGalleryImage, reorderGalleryImages, uploadGalleryImage } from "../actions";
import { ImageInfoDialog } from "./image-info-dialog";

const screenReaderInstructions = {
  draggable:
    "Чтобы взять изображение, нажмите пробел или Enter. Стрелками выберите новое место, пробелом или Enter поставьте, Escape — отмена.",
};

const imageLabel = (image: GalleryImage) => image.alt ?? image.originalName;

function announcements(images: GalleryImage[]): Announcements {
  const title = (id: string | number) => {
    const image = images.find((item) => item.id === id);
    return `«${image ? imageLabel(image) : id}»`;
  };
  return {
    onDragStart: ({ active }) => `Взято изображение ${title(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Изображение ${title(active.id)} над позицией ${title(over.id)}.`
        : `Изображение ${title(active.id)} вне галереи.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Изображение ${title(active.id)} поставлено на место ${title(over.id)}.`
        : `Изображение ${title(active.id)} возвращено на прежнее место.`,
    onDragCancel: ({ active }) => `Перемещение изображения ${title(active.id)} отменено.`,
  };
}

export function GalleryImages({
  galleryId,
  images: initial,
}: {
  galleryId: number;
  images: GalleryImage[];
}) {
  const router = useRouter();
  const [images, setImages] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  const [, startTransition] = useTransition();

  // После router.refresh() приходят свежие данные с сервера — принимаем их.
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setImages(initial);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const previous = images;
    const next = arrayMove(
      images,
      images.findIndex((image) => image.id === active.id),
      images.findIndex((image) => image.id === over.id),
    );
    setImages(next);

    startTransition(async () => {
      const result = await reorderGalleryImages(
        galleryId,
        next.map((image) => image.id),
      );
      if (!result.ok) {
        setImages(previous);
        toast.error(result.error);
        return;
      }
      toast.success("Порядок сохранён");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <UploadZone galleryId={galleryId} />
      {images.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">В галерее пока нет изображений</p>
      ) : (
        <DndContext
          id={`gallery-${galleryId}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{ announcements: announcements(images), screenReaderInstructions }}
        >
          <SortableContext items={images.map((image) => image.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {images.map((image) => (
                <SortableTile key={image.id} galleryId={galleryId} image={image} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// Файлы отправляются по одному: у server action ограничен размер запроса,
// а загрузки в одну галерею сервер всё равно выполняет по очереди.
function UploadZone({ galleryId }: { galleryId: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const pending = progress !== null;

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0 || pending) return;
    let uploaded = 0;
    setProgress({ done: 0, total: files.length });
    for (const [index, file] of files.entries()) {
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name}: файл больше 10 МБ`);
      } else {
        const formData = new FormData();
        formData.set("file", file);
        const result = await uploadGalleryImage(galleryId, formData);
        if (result.ok) uploaded++;
        else toast.error(`${file.name}: ${result.error}`);
      }
      setProgress({ done: index + 1, total: files.length });
    }
    setProgress(null);
    if (uploaded > 0) {
      toast.success(
        uploaded === files.length
          ? `Загружено изображений: ${uploaded}`
          : `Загружено ${uploaded} из ${files.length}`,
      );
      router.refresh();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-lg border border-dashed p-4 transition-colors",
        dragOver && "border-primary bg-muted/50",
      )}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragOver(false);
        void uploadFiles([...event.dataTransfer.files]);
      }}
    >
      <input
        ref={inputRef}
        id="gallery-upload"
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="sr-only"
        aria-label="Файлы изображений"
        disabled={pending}
        onChange={(event) => {
          void uploadFiles([...(event.target.files ?? [])]);
          event.target.value = ""; // чтобы те же файлы можно было выбрать снова
        }}
      />
      <Button type="button" disabled={pending} onClick={() => inputRef.current?.click()}>
        <UploadIcon />
        {pending
          ? `Загружаем ${Math.min(progress.done + 1, progress.total)} из ${progress.total}…`
          : "Загрузить изображения"}
      </Button>
      <p className="text-muted-foreground text-sm">
        Можно выбрать несколько файлов или перетащить их сюда. JPEG, PNG, WebP, GIF или AVIF до 10
        МБ, сохраняются в WebP.
      </p>
    </div>
  );
}

function SortableTile({ galleryId, image }: { galleryId: number; image: GalleryImage }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });
  const label = imageLabel(image);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-80" : undefined}
    >
      <figure className="bg-background overflow-hidden rounded-lg border">
        <div className="bg-muted relative aspect-square">
          <Image
            src={image.url}
            alt={image.alt ?? ""}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
          />
        </div>
        <figcaption className="flex items-center gap-1 p-1">
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Перетащить «${label}»`}
            className="text-muted-foreground hover:text-foreground cursor-grab rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon className="size-4" />
          </button>
          <span
            className={cn("min-w-0 flex-1 truncate text-xs", !image.alt && "text-muted-foreground")}
            title={label}
          >
            {image.alt ?? (
              <>
                <ImageIcon className="mr-1 inline size-3" aria-hidden />
                без описания
              </>
            )}
          </span>
          <ImageInfoDialog image={image} />
          <ConfirmAction
            action={removeGalleryImage.bind(null, galleryId, image.id)}
            title="Убрать изображение?"
            description="Изображение пропадёт из галереи. Если оно больше нигде не используется, файл будет удалён."
            confirmLabel="Убрать"
            successMessage="Изображение убрано"
            variant="ghost"
            size="icon-sm"
            aria-label={`Убрать «${label}»`}
          >
            <Trash2Icon />
          </ConfirmAction>
        </figcaption>
      </figure>
    </li>
  );
}
