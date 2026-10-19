import Image from "next/image";
import type { PublicGallery } from "@/server/site/service";

// Сетка миниатюр, каждая ведёт на картинку целиком.
export function Gallery({ gallery }: { gallery: PublicGallery }) {
  if (gallery.images.length === 0) return null;
  return (
    <figure className="not-prose my-8">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {gallery.images.map((image) => (
          <li key={image.url}>
            <a
              href={image.url}
              className="bg-muted relative block aspect-[4/3] overflow-hidden rounded-md focus-visible:ring-2 focus-visible:outline-none"
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform hover:scale-105"
              />
            </a>
          </li>
        ))}
      </ul>
      <figcaption className="text-muted-foreground mt-2 text-sm">{gallery.title}</figcaption>
    </figure>
  );
}
