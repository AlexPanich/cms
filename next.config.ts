import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // Не создавать AGENTS.md в корне при запуске: инструкции для Claude — в CLAUDE.md.
  agentRules: false,
  experimental: {
    // forbidden() и forbidden.tsx для ответа 403.
    authInterrupts: true,
    // Загрузка файлов идёт через server actions: документ до 20 МБ (MAX_DOCUMENT_BYTES)
    // плюс заголовки multipart. Запросы к /admin проходят через proxy, у него свой лимит.
    serverActions: { bodySizeLimit: "21mb" },
    proxyClientMaxBodySize: "21mb",
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
