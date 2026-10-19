import type { StaticImageData } from "next/image";
import type { BlockType } from "@/lib/blocks/registry";
import quote from "./previews/quote.svg";

// Превью только у своего блока: у остальных редактор показывает значок.
export const BLOCK_PREVIEWS: Partial<Record<BlockType, StaticImageData>> = { quote };
