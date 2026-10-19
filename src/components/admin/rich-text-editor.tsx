"use client";

import { type Editor, EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldIcon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  Undo2Icon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RichTextDoc } from "@/lib/rich-text";

type RichTextEditorProps = {
  id: string;
  labelledBy?: string;
  value: RichTextDoc | null;
  onChange: (value: RichTextDoc | null) => void;
  onBlur?: () => void;
  invalid?: boolean;
};

export function RichTextEditor({
  id,
  labelledBy,
  value,
  onChange,
  onBlur,
  invalid,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
        },
      }),
    ],
    content: value ?? "",
    // Next рендерит компонент на сервере — редактор создаём только в браузере.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        ...(labelledBy && { "aria-labelledby": labelledBy }),
        role: "textbox",
        "aria-multiline": "true",
        "aria-invalid": String(Boolean(invalid)),
        class:
          "prose prose-sm dark:prose-invert min-h-48 max-w-none px-3 py-2 focus-visible:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? null : (editor.getJSON() as RichTextDoc)),
    onBlur: () => onBlur?.(),
  });

  return (
    <div
      data-invalid={invalid}
      className="border-input focus-within:border-ring focus-within:ring-ring/50 data-[invalid=true]:border-destructive rounded-lg border focus-within:ring-3"
    >
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      blockquote: editor.isActive("blockquote"),
      link: editor.isActive("link"),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });
  const [linkOpen, setLinkOpen] = useState(false);
  const chain = () => editor.chain().focus();

  return (
    <div className="border-b">
      <div role="toolbar" aria-label="Форматирование" className="flex flex-wrap gap-0.5 p-1">
        <ToolbarButton
          label="Жирный"
          active={state.bold}
          onClick={() => chain().toggleBold().run()}
        >
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Курсив"
          active={state.italic}
          onClick={() => chain().toggleItalic().run()}
        >
          <ItalicIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Зачёркнутый"
          active={state.strike}
          onClick={() => chain().toggleStrike().run()}
        >
          <StrikethroughIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Заголовок 2"
          active={state.h2}
          onClick={() => chain().toggleHeading({ level: 2 }).run()}
        >
          <Heading2Icon />
        </ToolbarButton>
        <ToolbarButton
          label="Заголовок 3"
          active={state.h3}
          onClick={() => chain().toggleHeading({ level: 3 }).run()}
        >
          <Heading3Icon />
        </ToolbarButton>
        <ToolbarButton
          label="Маркированный список"
          active={state.bulletList}
          onClick={() => chain().toggleBulletList().run()}
        >
          <ListIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Нумерованный список"
          active={state.orderedList}
          onClick={() => chain().toggleOrderedList().run()}
        >
          <ListOrderedIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Цитата"
          active={state.blockquote}
          onClick={() => chain().toggleBlockquote().run()}
        >
          <QuoteIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Ссылка"
          active={state.link || linkOpen}
          onClick={() => setLinkOpen((open) => !open)}
        >
          <LinkIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Отменить"
          disabled={!state.canUndo}
          onClick={() => chain().undo().run()}
        >
          <Undo2Icon />
        </ToolbarButton>
        <ToolbarButton
          label="Повторить"
          disabled={!state.canRedo}
          onClick={() => chain().redo().run()}
        >
          <Redo2Icon />
        </ToolbarButton>
      </div>
      {linkOpen && <LinkForm editor={editor} onClose={() => setLinkOpen(false)} />}
    </div>
  );
}

function ToolbarButton({
  label,
  active = false,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

// Адрес ссылки проверяет расширение Link: javascript: и прочие опасные схемы не пройдут.
function LinkForm({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [href, setHref] = useState<string>(editor.getAttributes("link").href ?? "");
  const hadLink = editor.isActive("link");

  const apply = () => {
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href.trim()) chain.setLink({ href: href.trim() }).run();
    else chain.unsetLink().run();
    onClose();
  };

  return (
    <div className="flex gap-2 border-t p-2">
      <Input
        type="url"
        value={href}
        onChange={(event) => setHref(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            apply();
          }
          if (event.key === "Escape") onClose();
        }}
        placeholder="https://example.com"
        aria-label="Адрес ссылки"
        autoFocus
      />
      <Button type="button" size="sm" onClick={apply}>
        {href.trim() ? "Применить" : hadLink ? "Убрать ссылку" : "Закрыть"}
      </Button>
    </div>
  );
}
