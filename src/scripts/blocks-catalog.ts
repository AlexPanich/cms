// Пишет docs/BLOCKS.md из описаний блоков и настроек сайта.
//   pnpm blocks:catalog           — обновить файл
//   pnpm blocks:catalog --check   — только проверить, что он не устарел (CI)
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { format, resolveConfig } from "prettier";
import { renderBlocksDoc } from "@/lib/blocks/catalog-doc";

const FILE = path.resolve("docs/BLOCKS.md");

async function main() {
  const { values } = parseArgs({ options: { check: { type: "boolean", default: false } } });
  // Через prettier — чтобы файл проходил pnpm format:check.
  const expected = await format(renderBlocksDoc(), {
    ...(await resolveConfig(FILE)),
    filepath: FILE,
  });
  const current = await readFile(FILE, "utf8").catch(() => null);

  if (values.check) {
    if (current !== expected) {
      console.error("docs/BLOCKS.md устарел: запустите pnpm blocks:catalog и закоммитьте файл");
      process.exit(1);
    }
    console.log("docs/BLOCKS.md актуален");
    return;
  }
  if (current === expected) {
    console.log("docs/BLOCKS.md не изменился");
    return;
  }
  await writeFile(FILE, expected);
  console.log("docs/BLOCKS.md обновлён");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
