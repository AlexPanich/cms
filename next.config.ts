import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // forbidden() и forbidden.tsx для ответа 403.
    authInterrupts: true,
    // Загрузка картинок идёт через server actions: файл до 10 МБ (MAX_IMAGE_BYTES)
    // плюс заголовки multipart. Запросы к /admin проходят через proxy, у него свой лимит.
    serverActions: { bodySizeLimit: "11mb" },
    proxyClientMaxBodySize: "11mb",
  },
  // next/image оптимизирует только загруженные картинки.
  images: { localPatterns: [{ pathname: "/media/**" }] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
