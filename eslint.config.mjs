import { defineConfig } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([
  {
    ignores: ["dist/**/*", ".next/**/*", "out/**/*", ".cf-api-backup/**/*", ".open-next/**/*", ".wrangler/**/*"],
  },
  {
    extends: [...next],
  },
]);
