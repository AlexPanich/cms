import path from "node:path";
import { defineConfig } from "vitest/config";

const src = path.resolve(import.meta.dirname, "src");

export default defineConfig({
  resolve: {
    alias: {
      "@": src,
      "server-only": path.join(src, "test/server-only.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    globalSetup: ["src/test/global-setup.ts"],
    setupFiles: ["src/test/setup.ts"],
  },
});
