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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  LayoutTemplateIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  type Control,
  Controller,
  type FieldValues,
  get,
  useFieldArray,
  useFormState,
  useWatch,
} from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fieldsFormData, type FormBlock } from "@/lib/blocks/form";
import {
  BLOCKS,
  type Block,
  blocksExcerpt,
  blockVariants,
  getBlockDefinition,
  MAX_BLOCKS,
} from "@/lib/blocks/registry";
import { BLOCK_PREVIEWS } from "@/theme/blocks/previews";
import { BlockFields } from "./block-fields";

// Редактор блоков страницы — поле «blocks» формы страницы. Порядок меняется перетаскиванием
// (мышью или клавиатурой, как в дереве страниц), форма блока строится по его полям.
// Блоки сохраняются вместе со страницей.

const NAME = "blocks";

// Оформление по умолчанию — отдельный ключ: в Base UI Select null значит «ничего не выбрано».
const DEFAULT_VARIANT = "default";

const blockLabel = (type: string) =>
  getBlockDefinition(type)?.label ?? `Неизвестный блок «${type}»`;

const screenReaderInstructions = {
  draggable:
    "Чтобы взять блок, нажмите пробел или Enter. Стрелками вверх и вниз выберите новое место, пробелом или Enter поставьте, Escape — отмена.",
};

function announcements(items: readonly { _key: string; type: string }[]): Announcements {
  const title = (id: string | number) => {
    const index = items.findIndex((item) => item._key === id);
    return index === -1 ? "" : `«${blockLabel(items[index].type)}» (${index + 1})`;
  };
  return {
    onDragStart: ({ active }) => `Взят блок ${title(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Блок ${title(active.id)} над позицией ${title(over.id)}.`
        : `Блок ${title(active.id)} вне списка.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Блок ${title(active.id)} поставлен на место ${title(over.id)}.`
        : `Блок ${title(active.id)} возвращён на прежнее место.`,
    onDragCancel: ({ active }) => `Перемещение блока ${title(active.id)} отменено.`,
  };
}

export function BlocksEditor({ control }: { control: Control<FieldValues> }) {
  const { fields, append, remove, move } = useFieldArray({ control, name: NAME, keyName: "_key" });
  const blocks = fields as unknown as (FormBlock & { _key: string })[];
  // Свёрнутые блоки — по ключу строки, чтобы состояние не съезжало при перестановке.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    move(
      blocks.findIndex((block) => block._key === active.id),
      blocks.findIndex((block) => block._key === over.id),
    );
  };

  const toggle = (key: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const add = (type: string) => {
    const definition = getBlockDefinition(type);
    if (!definition) return;
    append({
      id: crypto.randomUUID(),
      type,
      variant: null,
      data: fieldsFormData(definition.fields),
    } satisfies FormBlock);
    setAdding(false);
  };

  const allCollapsed = blocks.length > 0 && blocks.every((block) => collapsed.has(block._key));
  const { errors } = useFormState({ control, name: NAME });
  const listError = get(errors, NAME) as { message?: string; root?: { message?: string } };

  return (
    <section aria-labelledby="blocks-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="blocks-title" className="text-base font-medium">
          Блоки страницы
        </h2>
        {blocks.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setCollapsed(allCollapsed ? new Set() : new Set(blocks.map((block) => block._key)))
            }
          >
            {allCollapsed ? "Развернуть все" : "Свернуть все"}
          </Button>
        )}
      </div>

      {blocks.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          На странице пока нет блоков. Обычная текстовая страница — один блок «Текст».
        </p>
      ) : (
        <DndContext
          id="page-blocks"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          accessibility={{ announcements: announcements(blocks), screenReaderInstructions }}
        >
          <SortableContext
            items={blocks.map((block) => block._key)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="flex flex-col gap-3">
              {blocks.map((block, index) => (
                <BlockCard
                  key={block._key}
                  sortableId={block._key}
                  control={control}
                  index={index}
                  type={block.type}
                  collapsed={collapsed.has(block._key)}
                  onToggle={() => toggle(block._key)}
                  onRemove={() => remove(index)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <FieldError errors={[listError?.root, listError?.message ? listError : undefined]} />

      <div>
        <Button
          type="button"
          variant="outline"
          disabled={blocks.length >= MAX_BLOCKS}
          onClick={() => setAdding(true)}
        >
          <PlusIcon />
          Добавить блок
        </Button>
      </div>

      <BlockCatalogDialog open={adding} onOpenChange={setAdding} onSelect={add} />
    </section>
  );
}

function BlockCard({
  sortableId,
  control,
  index,
  type,
  collapsed,
  onToggle,
  onRemove,
}: {
  sortableId: string;
  control: Control<FieldValues>;
  index: number;
  type: string;
  collapsed: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });
  const name = `${NAME}.${index}`;
  const definition = getBlockDefinition(type);
  const variants = blockVariants(type);
  const label = blockLabel(type);
  const bodyId = `block-${sortableId}-body`;

  const { errors } = useFormState({ control, name });
  const hasErrors = Boolean(get(errors, name));
  // Блок с ошибками не прячем: иначе непонятно, почему страница не сохраняется.
  const hidden = collapsed && !hasErrors;
  const data = useWatch({ control, name: `${name}.data`, disabled: !hidden });
  const summary = hidden && definition ? blocksExcerpt([{ type, data } as Block], 120) : null;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-80" : undefined}
    >
      <div className="bg-background rounded-lg border" data-invalid={hasErrors || undefined}>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Перетащить блок «${label}» (${index + 1})`}
            className="text-muted-foreground hover:text-foreground cursor-grab rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-expanded={!hidden}
            aria-controls={bodyId}
            className="flex min-w-0 flex-1 items-center gap-2 rounded p-1 text-left focus-visible:ring-2 focus-visible:outline-none"
            onClick={onToggle}
          >
            {hidden ? (
              <ChevronRightIcon className="size-4 shrink-0" aria-hidden />
            ) : (
              <ChevronDownIcon className="size-4 shrink-0" aria-hidden />
            )}
            <span className="font-medium">{label}</span>
            {summary && <span className="text-muted-foreground truncate text-sm">{summary}</span>}
          </button>
          {hasErrors && <Badge variant="destructive">Нужно исправить</Badge>}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Удалить блок «${label}» (${index + 1})`}
            onClick={onRemove}
          >
            <Trash2Icon />
          </Button>
        </div>

        <div id={bodyId} hidden={hidden} className="flex flex-col gap-6 border-t p-4">
          {definition ? (
            <>
              {variants.length > 0 && (
                <VariantSelect control={control} name={`${name}.variant`} type={type} />
              )}
              <BlockFields control={control} fields={definition.fields} name={`${name}.data`} />
            </>
          ) : (
            <p className="text-sm">
              Такого блока нет в теме сайта, поэтому на сайте он не выводится. Удалите его, чтобы
              сохранить страницу.
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

function VariantSelect({
  control,
  name,
  type,
}: {
  control: Control<FieldValues>;
  name: string;
  type: string;
}) {
  const options = [
    { value: DEFAULT_VARIANT, label: "По умолчанию" },
    ...blockVariants(type).map((variant) => ({ value: variant.key, label: variant.label })),
  ];
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={name}>Оформление</FieldLabel>
          <Select
            items={options}
            value={field.value ?? DEFAULT_VARIANT}
            onValueChange={(value) => field.onChange(value === DEFAULT_VARIANT ? null : value)}
          >
            <SelectTrigger id={name} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    />
  );
}

// Каталог блоков: тип, описание и превью из темы. Выбранный блок добавляется в конец страницы.
function BlockCatalogDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Добавить блок</DialogTitle>
          <DialogDescription>
            Блок появится в конце страницы, потом его можно перетащить
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BLOCKS.map((definition) => {
            const preview = BLOCK_PREVIEWS[definition.type];
            return (
              <li key={definition.type}>
                <button
                  type="button"
                  className="hover:bg-muted/50 flex h-full w-full flex-col overflow-hidden rounded-lg border text-left focus-visible:ring-2 focus-visible:outline-none"
                  onClick={() => onSelect(definition.type)}
                >
                  <span className="bg-muted flex aspect-video w-full items-center justify-center border-b">
                    {preview ? (
                      <Image src={preview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <LayoutTemplateIcon className="text-muted-foreground size-8" aria-hidden />
                    )}
                  </span>
                  <span className="flex flex-col gap-1 p-3">
                    <span className="font-medium">{definition.label}</span>
                    <span className="text-muted-foreground text-sm">{definition.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
