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
import { GripVerticalIcon, HomeIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ButtonLink } from "@/components/admin/button-link";
import { Badge } from "@/components/ui/badge";
import type { PageTreeNode } from "@/server/pages/service";
import { reorderPages } from "../actions";

// Порядок меняется перетаскиванием внутри одного уровня (мышью или клавиатурой:
// Пробел на ручке, стрелки, Пробел). Перенос в другую ветку — через поле «Родитель» в форме.
export function PageTree({ tree }: { tree: PageTreeNode[] }) {
  if (tree.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">Страниц пока нет</p>;
  }
  return <SortableLevel parentId={null} nodes={tree} />;
}

const screenReaderInstructions = {
  draggable:
    "Чтобы взять страницу, нажмите пробел или Enter. Стрелками вверх и вниз выберите новое место, пробелом или Enter поставьте, Escape — отмена.",
};

// Объявления для скринридеров на русском и с названиями страниц вместо внутренних id.
function announcements(items: PageTreeNode[]): Announcements {
  const title = (id: string | number) => `«${items.find((item) => item.id === id)?.title ?? id}»`;
  return {
    onDragStart: ({ active }) => `Взята страница ${title(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Страница ${title(active.id)} над позицией ${title(over.id)}.`
        : `Страница ${title(active.id)} вне списка.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Страница ${title(active.id)} поставлена на место ${title(over.id)}.`
        : `Страница ${title(active.id)} возвращена на прежнее место.`,
    onDragCancel: ({ active }) => `Перемещение страницы ${title(active.id)} отменено.`,
  };
}

function SortableLevel({ parentId, nodes }: { parentId: number | null; nodes: PageTreeNode[] }) {
  const router = useRouter();
  const [items, setItems] = useState(nodes);
  const [prevNodes, setPrevNodes] = useState(nodes);
  const [, startTransition] = useTransition();

  // После router.refresh() приходят свежие данные с сервера — принимаем их.
  if (nodes !== prevNodes) {
    setPrevNodes(nodes);
    setItems(nodes);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
      const result = await reorderPages(
        parentId,
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
      id={`pages-${parentId ?? "root"}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements: announcements(items), screenReaderInstructions }}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className={parentId === null ? "flex flex-col gap-1" : "mt-1 ml-6 flex flex-col gap-1"}>
          {items.map((node) => (
            <SortableRow key={node.id} node={node} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ node }: { node: PageTreeNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

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
          aria-label={`Перетащить «${node.title}»`}
          className="text-muted-foreground hover:text-foreground cursor-grab rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
          {node.isHome && (
            <HomeIcon className="text-muted-foreground size-4" aria-label="Главная" />
          )}
          <Link href={`/admin/pages/${node.id}`} className="truncate font-medium hover:underline">
            {node.title}
          </Link>
          <span className="text-muted-foreground truncate text-xs">/{node.path}</span>
          {!node.published && <Badge variant="outline">черновик</Badge>}
        </div>
        <ButtonLink
          href={`/admin/pages/new?parent=${node.id}`}
          variant="ghost"
          size="icon-sm"
          aria-label={`Добавить подстраницу в «${node.title}»`}
          title="Добавить подстраницу"
        >
          <PlusIcon />
        </ButtonLink>
      </div>
      {node.children.length > 0 && <SortableLevel parentId={node.id} nodes={node.children} />}
    </li>
  );
}
