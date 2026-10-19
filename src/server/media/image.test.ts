import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MediaError } from "./errors";
import { MAX_IMAGE_SIDE, processImage } from "./image";

const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: "#3366cc" } });

async function expectUnsupported(input: Uint8Array) {
  await expect(processImage(input)).rejects.toSatisfy(
    (error) => error instanceof MediaError && error.code === "unsupported_image",
  );
}

describe("processImage", () => {
  it.each(["png", "jpeg", "gif", "avif"] as const)("перекодирует %s в WebP", async (format) => {
    const input = await solid(40, 30).toFormat(format).toBuffer();
    const result = await processImage(input);
    expect(result).toMatchObject({ width: 40, height: 30 });
    expect((await sharp(result.data).metadata()).format).toBe("webp");
  });

  it("уменьшает большие картинки, не увеличивая маленькие", async () => {
    const input = await solid(MAX_IMAGE_SIDE * 2, 100)
      .png()
      .toBuffer();
    expect(await processImage(input)).toMatchObject({ width: MAX_IMAGE_SIDE, height: 50 });
  });

  it("поворачивает по EXIF и удаляет метаданные", async () => {
    const input = await solid(40, 30).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const result = await processImage(input);
    expect(result).toMatchObject({ width: 30, height: 40 });
    const metadata = await sharp(result.data).metadata();
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
  });

  it("отклоняет не-картинки и SVG", async () => {
    await expectUnsupported(new TextEncoder().encode("<?php echo 1; ?>"));
    await expectUnsupported(
      new TextEncoder().encode(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>',
      ),
    );
    // Картинка, у которой обрезан конец файла.
    const png = await solid(40, 30).png().toBuffer();
    await expectUnsupported(png.subarray(0, 60));
  });
});
