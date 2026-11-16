import { defineConfig } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([
  {
    ignores: ["dist/**/*", ".next/**/*", ".open-next/**/*", ".wrangler/**/*", "open-next.config.ts"],
  },
  {
    extends: [...next],
  },
]);
