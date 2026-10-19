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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLinkIcon, FileTextIcon, GripVerticalIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Badge } from "@/components/ui/badge";
import type { MenuItemView } from "@/server/menus/service";
import { deleteMenuItem, reorderMenuItems } from "../actions";

const screenReaderInstructions = {
  draggable:
    "Чтобы взять пункт меню, нажмите пробел или Enter. Стрелками вверх и вниз выберите новое место, пробелом или Enter поставьте, Escape — отмена.",
};

function announcements(items: MenuItemView[]): Announcements {
  const title = (id: string | number) => `«${items.find((item) => item.id === id)?.title ?? id}»`;
  return {
    onDragStart: ({ active }) => `Взят пункт ${title(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Пункт ${title(active.id)} над позицией ${title(over.id)}.`
        : `Пункт ${title(active.id)} вне списка.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Пункт ${title(active.id)} поставлен на место ${title(over.id)}.`
        : `Пункт ${title(active.id)} возвращён на прежнее место.`,
    onDragCancel: ({ active }) => `Перемещение пункта ${title(active.id)} отменено.`,
  };
}

// Порядок пунктов меняется перетаскиванием мышью или с клавиатуры (как в дереве страниц).
export function MenuItemList({
  menuId,
  items: initial,
}: {
  menuId: number;
  items: MenuItemView[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  const [, startTransition] = useTransition();

  // После router.refresh() приходят свежие данные с сервера — принимаем их.
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setItems(initial);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (items.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">В меню пока нет пунктов</p>;
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const previous = items;
    const next = arrayMove(
      items,
      items.findIndex((item) => item.id === active.id),
      items.findIndex((item) => item.id === over.id),
    );
    setItems(next);

    startTransition(async () => {
      const result = await reorderMenuItems(
        menuId,
        next.map((item) => item.id),
      );
      if (!result.ok) {
        setItems(previous);
        toast.error(result.error);
        return;
      }
      toast.success("Порядок сохранён");
      router.refresh();
    });
  };

  return (
    <DndContext
      id={`menu-${menuId}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements: announcements(items), screenReaderInstructions }}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <SortableRow key={item.id} menuId={menuId} item={item} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ menuId, item }: { menuId: number; item: MenuItemView }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const Icon = item.pageId === null ? ExternalLinkIcon : FileTextIcon;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-80" : undefined}
    >
      <div className="bg-background hover:bg-muted/50 flex items-center gap-2 rounded-lg border px-2 py-1.5">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Перетащить «${item.title}»`}
          className="text-muted-foreground hover:text-foreground cursor-grab rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>
        <Icon
          className="text-muted-foreground size-4 shrink-0"
          aria-label={item.pageId === null ? "Ссылка" : "Страница сайта"}
        />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
          <Link
            href={`/admin/menus/${menuId}/items/${item.id}`}
            className="truncate font-medium hover:underline"
          >
            {item.title}
          </Link>
          <span className="text-muted-foreground truncate text-xs">{item.href}</span>
          {!item.published && <Badge variant="outline">страница не опубликована</Badge>}
        </div>
        <ConfirmAction
          action={deleteMenuItem.bind(null, item.id)}
          title="Удалить пункт меню?"
          description={
            item.pageId === null
              ? `Пункт «${item.title}» пропадёт из меню.`
              : `Пункт «${item.title}» пропадёт из меню. Сама страница останется на сайте.`
          }
          successMessage="Пункт удалён"
          variant="ghost"
          size="icon-sm"
          aria-label={`Удалить «${item.title}»`}
        >
          <Trash2Icon />
        </ConfirmAction>
      </div>
    </li>
  );
}
