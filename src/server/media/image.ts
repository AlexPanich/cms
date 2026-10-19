import sharp from "sharp";
import { MediaError } from "./errors";

// Формат определяется по содержимому файла, а не по расширению или MIME от браузера.
// SVG не принимаем: это документ, в котором может быть скрипт.
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "gif", "heif"]);
// Защита от «бомб» — маленьких файлов, которые при распаковке занимают гигабайты памяти.
const MAX_INPUT_PIXELS = 50_000_000;
export const MAX_IMAGE_SIDE = 2560;

export type ProcessedImage = { data: Buffer; width: number; height: number };

// Перекодирует картинку в WebP: поворот по EXIF, без метаданных (в том числе геометок),
// не больше MAX_IMAGE_SIDE по длинной стороне. Перекодирование заодно убирает всё,
// что могли спрятать в файл помимо пикселей. У анимации остаётся первый кадр.
export async function processImage(input: Uint8Array): Promise<ProcessedImage> {
  const unsupported = () =>
    new MediaError(
      "unsupported_image",
      "Не удалось прочитать изображение. Подходят JPEG, PNG, WebP, GIF и AVIF",
      "file",
    );

  const metadata = await sharp(input)
    .metadata()
    .catch(() => {
      throw unsupported();
    });
  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) throw unsupported();
  if ((metadata.width ?? 0) * (metadata.height ?? 0) > MAX_INPUT_PIXELS) {
    throw new MediaError("unsupported_image", "Слишком большое разрешение изображения", "file");
  }

  try {
    const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize({
        width: MAX_IMAGE_SIDE,
        height: MAX_IMAGE_SIDE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch {
    throw unsupported();
  }
}
