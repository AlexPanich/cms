import type { BlockProps, BlockViews } from "@/components/site/blocks";
import { EditableTextBlock } from "@/components/site/editable";
import { RichText } from "@/components/site/rich-text";
import { PROSE, WIDGETS } from "../rich-text";

// Вид каждого блока из реестра (каталог ядра и THEME_BLOCKS). Блок оборачивает правку
// на сайте сам: только он знает, где в его разметке какое поле.

function TextBlock({ block, pageId, context }: BlockProps<"text">) {
  return (
    <EditableTextBlock pageId={pageId} block={block}>
      <RichText doc={block.data.content} context={context} widgets={WIDGETS} className={PROSE} />
    </EditableTextBlock>
  );
}

export const blockViews: BlockViews = {
  text: TextBlock,
};
