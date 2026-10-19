import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // zod — только через @/lib/zod: там настроены русские сообщения об ошибках.
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "zod", message: "Импортируйте z из @/lib/zod" }] },
      ],
    },
  },
  { files: ["src/lib/zod.ts"], rules: { "no-restricted-imports": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "legacy/**",
  ]),
]);

export default eslintConfig;
